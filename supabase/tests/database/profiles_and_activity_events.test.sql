-- RLS and trigger tests for profiles, activity_events and delete_current_user().
-- Run with: pnpm db:test
begin;
create extension if not exists pgtap with schema extensions;

select plan(19);

-- Two learners. The sign-up trigger should create their profiles.
insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data)
values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'alice@example.test', '{"display_name": "  Alice  "}'),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'bob@example.test', '{}');

select is(
  (select count(*)::int from public.profiles
   where id in ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222')),
  2, 'sign-up trigger creates a profile per user');
select is(
  (select display_name from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  'Alice', 'display name from sign-up metadata is trimmed');
select is(
  (select display_name from public.profiles where id = '22222222-2222-2222-2222-222222222222'),
  null, 'missing display name stays null');

insert into public.activity_events (user_id, type, module)
values ('22222222-2222-2222-2222-222222222222', 'lesson.completed', 'grammar');

-- ---------------------------------------------------------------- as Alice
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}', true);

select is((select count(*)::int from public.profiles), 1, 'learner sees only their own profile');
select is((select count(*)::int from public.activity_events), 0, 'learner cannot see other users'' events');

update public.profiles set display_name = 'Mallory' where id = '22222222-2222-2222-2222-222222222222';
select lives_ok(
  $$ update public.profiles set display_name = 'Alice B', explanation_language = 'vi'
     where id = '11111111-1111-1111-1111-111111111111' $$,
  'learner can update allowed columns of their own profile');
select throws_ok(
  $$ update public.profiles set created_at = now() where id = '11111111-1111-1111-1111-111111111111' $$,
  '42501', null, 'learner cannot update protected columns');
select throws_ok(
  $$ update public.profiles set explanation_language = 'fr' where id = '11111111-1111-1111-1111-111111111111' $$,
  '23514', null, 'invalid explanation language is rejected');
select throws_ok(
  $$ insert into public.profiles (id) values ('33333333-3333-3333-3333-333333333333') $$,
  '42501', null, 'learners cannot insert profiles directly');

select lives_ok(
  $$ insert into public.activity_events (type, module, ref_type, ref_id)
     values ('attempt.submitted', 'reading', 'practice_set', 'set-1') $$,
  'learner can append their own event (user_id defaults to auth.uid())');
select throws_ok(
  $$ insert into public.activity_events (user_id, type, module)
     values ('22222222-2222-2222-2222-222222222222', 'lesson.completed', 'grammar') $$,
  '42501', null, 'learner cannot write events for another user');
select throws_ok(
  $$ insert into public.activity_events (type, module) values ('Bad Type', 'reading') $$,
  '23514', null, 'malformed event type is rejected');
select throws_ok(
  $$ update public.activity_events set type = 'lesson.completed' $$,
  '42501', null, 'events are append-only (no update)');
select throws_ok(
  $$ delete from public.activity_events $$,
  '42501', null, 'events are append-only (no delete)');
select is((select count(*)::int from public.activity_events), 1, 'learner sees their own event');

-- ---------------------------------------------------------------- as anonymous
reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role": "anon"}', true);
select throws_ok($$ select * from public.profiles $$, '42501', null, 'anonymous users cannot read profiles');
select throws_ok($$ select public.delete_current_user() $$, '42501', null,
  'anonymous users cannot call delete_current_user');

-- ---------------------------------------------------------------- checks as superuser
reset role;
select is(
  (select display_name from public.profiles where id = '22222222-2222-2222-2222-222222222222'),
  null, 'learner could not update another user''s profile');

-- ---------------------------------------------------------------- account deletion as Bob
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}', true);
select public.delete_current_user();
reset role;
select is(
  (select count(*)::int from auth.users where id = '22222222-2222-2222-2222-222222222222')
  + (select count(*)::int from public.profiles where id = '22222222-2222-2222-2222-222222222222')
  + (select count(*)::int from public.activity_events where user_id = '22222222-2222-2222-2222-222222222222'),
  0, 'delete_current_user removes the user, profile and events');

select * from finish();
rollback;
