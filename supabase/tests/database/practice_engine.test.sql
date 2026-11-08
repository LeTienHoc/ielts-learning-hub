-- Content visibility, hidden answer keys, attempt lifecycle and scoring (P2 practice engine).
-- Run with: pnpm db:test
begin;
create extension if not exists pgtap with schema extensions;

select plan(38);

-- Fixtures (as the migration owner) -------------------------------------------------------
insert into auth.users (id, instance_id, aud, role, email)
values
  ('aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'learner-a@example.test'),
  ('aaaaaaaa-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'learner-b@example.test');

insert into public.content_items (id, type, slug, title, level, source, review_status)
values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'practice_set', 'test-published', 'Published set',
   'B1', 'original', 'published'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'practice_set', 'test-draft', 'Draft set',
   'B1', 'original', 'draft');

insert into public.practice_sets (id, module, test_time_limit_seconds)
values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'reading', 600),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'reading', null);
insert into public.practice_set_passages (practice_set_id, position, text)
values
  ('bbbbbbbb-0000-0000-0000-000000000001', 1, 'A short passage.'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 1, 'Draft passage.');

insert into public.question_groups (id, practice_set_id, position, question_type, instructions, options)
values
  ('cccccccc-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', 1,
   'true_false_not_given', 'Choose TRUE, FALSE or NOT GIVEN.',
   '[{"id":"TRUE","text":"True"},{"id":"FALSE","text":"False"},{"id":"NOT_GIVEN","text":"Not given"}]'),
  ('cccccccc-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000001', 2,
   'sentence_completion', 'Write NO MORE THAN TWO WORDS.', null),
  ('cccccccc-0000-0000-0000-000000000003', 'bbbbbbbb-0000-0000-0000-000000000001', 3,
   'multiple_choice_multi', 'Choose TWO letters.', null),
  ('cccccccc-0000-0000-0000-000000000009', 'bbbbbbbb-0000-0000-0000-000000000002', 1,
   'short_answer', 'Draft group.', null);

insert into public.questions (id, practice_set_id, group_id, position, number, prompt, options, response_kind, select_count, max_words)
values
  ('dddddddd-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001',
   'cccccccc-0000-0000-0000-000000000001', 1, 1, 'Statement one.', null, 'single', null, null),
  ('dddddddd-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000001',
   'cccccccc-0000-0000-0000-000000000002', 1, 2, 'Gap ____.', null, 'text', null, 2),
  ('dddddddd-0000-0000-0000-000000000003', 'bbbbbbbb-0000-0000-0000-000000000001',
   'cccccccc-0000-0000-0000-000000000003', 1, 3, 'Which TWO?',
   '[{"id":"A","text":"a"},{"id":"B","text":"b"},{"id":"C","text":"c"},{"id":"D","text":"d"}]',
   'multiple', 2, null),
  ('dddddddd-0000-0000-0000-000000000004', 'bbbbbbbb-0000-0000-0000-000000000001',
   'cccccccc-0000-0000-0000-000000000001', 2, 4, 'Statement two.', null, 'single', null, null),
  ('dddddddd-0000-0000-0000-000000000009', 'bbbbbbbb-0000-0000-0000-000000000002',
   'cccccccc-0000-0000-0000-000000000009', 1, 1, 'Draft question.', null, 'text', null, null);

insert into public.question_keys (question_id, accepted, explanation, evidence_start, evidence_end)
values
  ('dddddddd-0000-0000-0000-000000000001', '["TRUE"]', 'Because.', 0, 7),
  ('dddddddd-0000-0000-0000-000000000002', '["solar power", "solar energy"]', 'Because.', null, null),
  ('dddddddd-0000-0000-0000-000000000003', '["A", "C"]', 'Because.', null, null),
  ('dddddddd-0000-0000-0000-000000000004', '["FALSE"]', 'Because.', null, null),
  ('dddddddd-0000-0000-0000-000000000009', '["x"]', 'Because.', null, null);

-- As learner A ----------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "aaaaaaaa-0000-0000-0000-000000000001", "role": "authenticated"}', true);

-- Counts are limited to this test's sets so the local seed content does not affect them.
select is((select count(*)::int from public.content_items where slug like 'test-%'), 1,
  'learners see only published content');
select is((select count(*)::int from public.practice_sets where id::text like 'bbbbbbbb-%'), 1,
  'draft practice sets are hidden');
select is((select count(*)::int from public.questions where id::text like 'dddddddd-%'), 4,
  'questions of draft sets are hidden');
select throws_ok($$ select * from public.question_keys $$, '42501', null,
  'learners cannot read answer keys');
select throws_ok(
  $$ insert into public.attempts (user_id, practice_set_id, content_version, mode)
     values ('aaaaaaaa-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', 1, 'learn') $$,
  '42501', null, 'learners cannot insert attempts directly');

select throws_ok($$ select public.start_attempt('bbbbbbbb-0000-0000-0000-000000000002', 'learn') $$,
  'P0001', 'set_not_found', 'draft sets cannot be started');

create temporary table ids (name text primary key, id uuid) on commit drop;
grant all on ids to authenticated;
insert into ids values ('learn', public.start_attempt('bbbbbbbb-0000-0000-0000-000000000001', 'learn'));

select is(public.start_attempt('bbbbbbbb-0000-0000-0000-000000000001', 'test'),
  (select id from ids where name = 'learn'), 'starting again resumes the active attempt');
select is((select mode from public.attempts where id = (select id from ids where name = 'learn')),
  'learn', 'learn mode attempt has no deadline requirement');
select is((select deadline_at from public.attempts where id = (select id from ids where name = 'learn')),
  null, 'learn mode has no deadline');

select throws_ok(
  $$ select public.save_answer((select id from ids where name = 'learn'),
       'dddddddd-0000-0000-0000-000000000001', '["MAYBE"]') $$,
  'P0001', 'invalid_response', 'unknown option ids are rejected');
select throws_ok(
  $$ select public.save_answer((select id from ids where name = 'learn'),
       'dddddddd-0000-0000-0000-000000000003', '["A", "B", "C"]') $$,
  'P0001', 'invalid_response', 'choosing more options than allowed is rejected');
select throws_ok(
  $$ select public.save_answer((select id from ids where name = 'learn'),
       'dddddddd-0000-0000-0000-000000000003', '["A", "A"]') $$,
  'P0001', 'invalid_response', 'duplicate choices are rejected');
select throws_ok(
  $$ select public.save_answer((select id from ids where name = 'learn'),
       'dddddddd-0000-0000-0000-000000000002', '[42]') $$,
  'P0001', 'invalid_response', 'non-string answers are rejected');
select throws_ok(
  $$ select public.save_answer((select id from ids where name = 'learn'),
       'dddddddd-0000-0000-0000-000000000009', '["x"]') $$,
  'P0001', 'question_not_found', 'questions from another set are rejected');

select lives_ok(
  $$ select public.save_answer((select id from ids where name = 'learn'),
       'dddddddd-0000-0000-0000-000000000001', '["FALSE"]');
     select public.save_answer((select id from ids where name = 'learn'),
       'dddddddd-0000-0000-0000-000000000001', '["TRUE"]');
     select public.save_answer((select id from ids where name = 'learn'),
       'dddddddd-0000-0000-0000-000000000002', '["  Solar   ENERGY "]');
     select public.save_answer((select id from ids where name = 'learn'),
       'dddddddd-0000-0000-0000-000000000003', '["A", "B"]') $$,
  'valid answers save, and saving again replaces the answer');
select is(
  (select response from public.attempt_answers
   where attempt_id = (select id from ids where name = 'learn')
     and question_id = 'dddddddd-0000-0000-0000-000000000001'),
  '["TRUE"]'::jsonb, 'the latest answer is kept');

select throws_ok($$ select * from public.get_attempt_review((select id from ids where name = 'learn')) $$,
  'P0001', 'attempt_not_found', 'answer keys are hidden before submission');

-- As learner B ------------------------------------------------------------------------------
select set_config('request.jwt.claims',
  '{"sub": "aaaaaaaa-0000-0000-0000-000000000002", "role": "authenticated"}', true);

select is((select count(*)::int from public.attempts), 0, 'learners cannot see other learners'' attempts');
select throws_ok(
  $$ select public.save_answer((select id from ids where name = 'learn'),
       'dddddddd-0000-0000-0000-000000000001', '["FALSE"]') $$,
  'P0001', 'attempt_not_found', 'learners cannot answer someone else''s attempt');
select throws_ok($$ select public.submit_attempt((select id from ids where name = 'learn')) $$,
  'P0001', 'attempt_not_found', 'learners cannot submit someone else''s attempt');

-- Back to learner A: submit and score -------------------------------------------------------
select set_config('request.jwt.claims',
  '{"sub": "aaaaaaaa-0000-0000-0000-000000000001", "role": "authenticated"}', true);

select lives_ok($$ select public.submit_attempt((select id from ids where name = 'learn')) $$,
  'learner submits their attempt');
-- Q1 correct (1), Q2 text variant with case/space differences (1), Q3 one of two (1 of 2),
-- Q4 unanswered (0 of 1): 3 / 5.
select results_eq(
  $$ select score, max_score, status, submit_reason from public.attempts
     where id = (select id from ids where name = 'learn') $$,
  $$ values (3, 5, 'submitted'::text, 'learner'::text) $$,
  'score counts marks per question and multiple-choice partial credit');
select results_eq(
  $$ select question_id, is_correct, points from public.attempt_answers
     where attempt_id = (select id from ids where name = 'learn') order by question_id $$,
  $$ values
       ('dddddddd-0000-0000-0000-000000000001'::uuid, true, 1),
       ('dddddddd-0000-0000-0000-000000000002'::uuid, true, 1),
       ('dddddddd-0000-0000-0000-000000000003'::uuid, false, 1),
       ('dddddddd-0000-0000-0000-000000000004'::uuid, false, 0) $$,
  'each answer is marked, and unanswered questions count as wrong');
select is(
  (select count(*)::int from public.activity_events
   where type = 'attempt.submitted' and module = 'reading'
     and metadata ->> 'attempt_id' = (select id from ids where name = 'learn')::text),
  1, 'submitting records an activity event');

select throws_ok(
  $$ select public.save_answer((select id from ids where name = 'learn'),
       'dddddddd-0000-0000-0000-000000000004', '["FALSE"]') $$,
  'P0001', 'attempt_submitted', 'submitted attempts cannot be changed');
select lives_ok($$ select public.submit_attempt((select id from ids where name = 'learn')) $$,
  'submitting twice is harmless');
select is((select score from public.attempts where id = (select id from ids where name = 'learn')),
  3, 'a second submit keeps the first result');
select is(
  (select count(*)::int from public.get_attempt_review((select id from ids where name = 'learn'))),
  4, 'answer keys are revealed after submission');

-- Test mode and server-time deadlines -------------------------------------------------------
insert into ids values ('test', public.start_attempt('bbbbbbbb-0000-0000-0000-000000000001', 'test'));
select ok(
  (select deadline_at = started_at + interval '600 seconds' from public.attempts
   where id = (select id from ids where name = 'test')),
  'test mode deadline is the start time plus the set''s time limit');

-- Simulate the deadline passing (as the owner; learners cannot change attempts).
reset role;
update public.attempts
set started_at = now() - interval '20 minutes', deadline_at = now() - interval '10 minutes'
where id = (select id from ids where name = 'test');
set local role authenticated;

select throws_ok(
  $$ select public.save_answer((select id from ids where name = 'test'),
       'dddddddd-0000-0000-0000-000000000001', '["TRUE"]') $$,
  'P0001', 'attempt_expired', 'answers after the deadline are rejected');

insert into ids values ('next', public.start_attempt('bbbbbbbb-0000-0000-0000-000000000001', 'learn'));
select results_eq(
  $$ select status, submit_reason from public.attempts where id = (select id from ids where name = 'test') $$,
  $$ values ('submitted'::text, 'time_expired'::text) $$,
  'starting again auto-submits an expired attempt as time_expired');
select isnt((select id from ids where name = 'next'), (select id from ids where name = 'test'),
  'and starts a new attempt');

-- Hardening ---------------------------------------------------------------------------------
select throws_ok($$ select public.start_attempt('bbbbbbbb-0000-0000-0000-000000000001', null) $$,
  'P0001', 'invalid_response', 'a missing mode is rejected');
select throws_ok(
  $$ insert into public.activity_events (user_id, type, module, metadata)
     values ('aaaaaaaa-0000-0000-0000-000000000001', 'attempt.submitted', 'reading', '{"score": 40}') $$,
  '42501', null, 'learners cannot forge attempt events');
select lives_ok(
  $$ insert into public.activity_events (user_id, type, module)
     values ('aaaaaaaa-0000-0000-0000-000000000001', 'lesson.completed', 'grammar') $$,
  'learners can still append their other events');
select throws_ok(
  $$ select public.finalize_attempt((select id from ids where name = 'next'), 'learner') $$,
  '42501', null, 'the internal scoring function is not callable by learners');

select set_config('request.jwt.claims',
  '{"sub": "aaaaaaaa-0000-0000-0000-000000000002", "role": "authenticated"}', true);
select throws_ok($$ select * from public.get_attempt_review((select id from ids where name = 'learn')) $$,
  'P0001', 'attempt_not_found', 'learners cannot read keys through someone else''s submitted attempt');

reset role;
set local role anon;
select throws_ok($$ select public.start_attempt('bbbbbbbb-0000-0000-0000-000000000001', 'learn') $$,
  '42501', null, 'signed-out visitors cannot call the engine');
reset role;

select * from finish();
rollback;
