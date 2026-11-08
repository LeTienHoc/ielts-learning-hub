-- Grammar topics and the learn-mode instant check (P3). Run with: pnpm db:test
begin;
create extension if not exists pgtap with schema extensions;

select plan(16);

-- Fixtures (as the migration owner) -------------------------------------------------------
insert into auth.users (id, instance_id, aud, role, email)
values
  ('eeeeeeee-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'grammar-a@example.test'),
  ('eeeeeeee-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'grammar-b@example.test');

insert into public.content_items (id, type, slug, title, level, source, review_status)
values
  ('f0000000-0000-0000-0000-000000000001', 'grammar_topic', 'test-articles', 'Articles', 'B1', 'original', 'published'),
  ('f0000000-0000-0000-0000-000000000002', 'grammar_topic', 'test-draft-topic', 'Draft', 'B1', 'original', 'draft'),
  ('f0000000-0000-0000-0000-000000000011', 'practice_set', 'test-articles-practice', 'Articles practice', 'B1', 'original', 'published'),
  ('f0000000-0000-0000-0000-000000000012', 'practice_set', 'test-timed-set', 'Timed set', 'B1', 'original', 'published');

insert into public.practice_sets (id, module, test_time_limit_seconds)
values
  ('f0000000-0000-0000-0000-000000000011', 'grammar', null),
  ('f0000000-0000-0000-0000-000000000012', 'reading', 600);

insert into public.grammar_topics (id, position, lesson, practice_set_id)
values
  ('f0000000-0000-0000-0000-000000000001', 1, '{"introEn": "x"}', 'f0000000-0000-0000-0000-000000000011'),
  ('f0000000-0000-0000-0000-000000000002', 2, '{"introEn": "y"}', null);

insert into public.question_groups (id, practice_set_id, position, question_type, instructions)
values
  ('f1000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000011', 1, 'error_correction', 'Tap the mistake.'),
  ('f1000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000011', 2, 'sentence_transformation', 'Rewrite.'),
  ('f1000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000011', 3, 'multiple_choice', 'Choose.'),
  ('f1000000-0000-0000-0000-000000000004', 'f0000000-0000-0000-0000-000000000012', 1, 'multiple_choice', 'Choose.');

insert into public.questions (id, practice_set_id, group_id, position, number, prompt, options, response_kind)
values
  ('f2000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000011',
   'f1000000-0000-0000-0000-000000000001', 1, 1, 'She is a honest student.',
   '[{"id":"t1","text":"She"},{"id":"t2","text":"is"},{"id":"t3","text":"a"},{"id":"t4","text":"honest"},{"id":"t5","text":"student."}]',
   'single'),
  ('f2000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000011',
   'f1000000-0000-0000-0000-000000000002', 1, 2, 'I don''t have time, so I don''t travel. (If…)', null, 'text'),
  ('f2000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000011',
   'f1000000-0000-0000-0000-000000000003', 1, 3, 'Pick one.',
   '[{"id":"A","text":"an"},{"id":"B","text":"a"}]', 'single'),
  ('f2000000-0000-0000-0000-000000000004', 'f0000000-0000-0000-0000-000000000012',
   'f1000000-0000-0000-0000-000000000004', 1, 1, 'Timed.',
   '[{"id":"A","text":"a"},{"id":"B","text":"b"}]', 'single');

insert into public.question_keys (question_id, accepted, explanation, correction)
values
  ('f2000000-0000-0000-0000-000000000001', '["t3"]', '"Honest" starts with a vowel sound.', 'She is an honest student.'),
  ('f2000000-0000-0000-0000-000000000002', '["If I had more time, I would travel."]', 'Second conditional.', null),
  ('f2000000-0000-0000-0000-000000000003', '["A"]', 'Vowel sound.', null),
  ('f2000000-0000-0000-0000-000000000004', '["A"]', 'Timed.', null);

create temporary table ids (name text primary key, id uuid) on commit drop;
grant all on ids to authenticated;

-- As learner A ----------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "eeeeeeee-0000-0000-0000-000000000001", "role": "authenticated"}', true);

select is((select count(*)::int from public.grammar_topics
           where id::text like 'f0000000-0000-0000-0000-00000000000%'), 1,
  'grammar topics of draft content are hidden');

insert into ids values ('learn', public.start_attempt('f0000000-0000-0000-0000-000000000011', 'learn'));
insert into ids values ('test', public.start_attempt('f0000000-0000-0000-0000-000000000012', 'test'));

select results_eq(
  $$ select is_correct, points from public.check_answer((select id from ids where name = 'learn'),
       'f2000000-0000-0000-0000-000000000001', '["t3"]') $$,
  $$ values (true, 1) $$,
  'checking a correct answer marks it correct');
select is(
  (select count(*)::int from public.check_answer((select id from ids where name = 'learn'),
     'f2000000-0000-0000-0000-000000000003', '["B"]')),
  1, 'a check reveals exactly one key');
select throws_ok($$ select correction from public.question_keys $$, '42501', null,
  'learners still cannot read the keys table');

select throws_ok(
  $$ select public.save_answer((select id from ids where name = 'learn'),
       'f2000000-0000-0000-0000-000000000001', '["t4"]') $$,
  'P0001', 'answer_locked', 'a checked answer cannot be changed');
select throws_ok(
  $$ select * from public.check_answer((select id from ids where name = 'learn'),
       'f2000000-0000-0000-0000-000000000001', '["t4"]') $$,
  'P0001', 'answer_locked', 'a checked answer cannot be checked again');
select throws_ok(
  $$ select * from public.check_answer((select id from ids where name = 'test'),
       'f2000000-0000-0000-0000-000000000004', '["A"]') $$,
  'P0001', 'check_unavailable', 'instant check is not available in test mode');
select results_eq(
  $$ select is_correct from public.check_answer((select id from ids where name = 'learn'),
       'f2000000-0000-0000-0000-000000000002', '["  If I Had  more time, I would travel. "]') $$,
  $$ values (true) $$,
  'transformation answers ignore case and extra spaces');

-- As learner B ----------------------------------------------------------------------------
select set_config('request.jwt.claims',
  '{"sub": "eeeeeeee-0000-0000-0000-000000000002", "role": "authenticated"}', true);
select throws_ok(
  $$ select * from public.check_answer((select id from ids where name = 'learn'),
       'f2000000-0000-0000-0000-000000000003', '["A"]') $$,
  'P0001', 'attempt_not_found', 'learners cannot check someone else''s attempt');

-- Back to A: submit -----------------------------------------------------------------------
select set_config('request.jwt.claims',
  '{"sub": "eeeeeeee-0000-0000-0000-000000000001", "role": "authenticated"}', true);
select lives_ok($$ select public.submit_attempt((select id from ids where name = 'learn')) $$,
  'a partly checked attempt can be submitted');
-- Q1 checked correct, Q2 checked correct, Q3 checked wrong: 2 / 3.
select results_eq(
  $$ select score, max_score from public.attempts where id = (select id from ids where name = 'learn') $$,
  $$ values (2, 3) $$,
  'submitting keeps the checked results');
select throws_ok(
  $$ select * from public.check_answer((select id from ids where name = 'learn'),
       'f2000000-0000-0000-0000-000000000003', '["A"]') $$,
  'P0001', 'attempt_submitted', 'submitted attempts cannot be checked');
select is(
  (select correction from public.get_attempt_review((select id from ids where name = 'learn'))
   where question_id = 'f2000000-0000-0000-0000-000000000001'),
  'She is an honest student.', 'the review includes the corrected sentence');

select throws_ok(
  $$ select public.score_answer('f2000000-0000-0000-0000-000000000001', '["t3"]') $$,
  '42501', null, 'learners cannot call the scoring helper');
select throws_ok(
  $$ insert into public.activity_events (user_id, type, module)
     values ('eeeeeeee-0000-0000-0000-000000000001', 'vocabulary.reviewed', 'vocabulary') $$,
  '42501', null, 'learners cannot forge vocabulary events');
select throws_ok(
  $$ insert into public.activity_events (user_id, type, module)
     values ('eeeeeeee-0000-0000-0000-000000000001', 'grammar.mastered', 'grammar') $$,
  '42501', null, 'learners cannot forge grammar events');

select * from finish();
rollback;
