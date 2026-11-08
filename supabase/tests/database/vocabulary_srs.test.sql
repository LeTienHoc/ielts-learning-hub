-- Vocabulary sets, My words and SRS review (P3). Run with: pnpm db:test
begin;
create extension if not exists pgtap with schema extensions;

select plan(32);

-- Fixtures (as the migration owner) -------------------------------------------------------
insert into auth.users (id, instance_id, aud, role, email)
values
  ('a1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'vocab-a@example.test'),
  ('a1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'vocab-b@example.test'),
  ('a1000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'vocab-c@example.test');

insert into public.content_items (id, type, slug, title, level, source, review_status)
values
  ('b1000000-0000-0000-0000-000000000001', 'vocabulary_set', 'test-vocab-one', 'One', 'B1', 'original', 'published'),
  ('b1000000-0000-0000-0000-000000000002', 'vocabulary_set', 'test-vocab-two', 'Two', 'B1', 'original', 'published'),
  ('b1000000-0000-0000-0000-000000000003', 'vocabulary_set', 'test-vocab-draft', 'Draft', 'B1', 'original', 'draft');
insert into public.vocabulary_sets (id)
values ('b1000000-0000-0000-0000-000000000001'), ('b1000000-0000-0000-0000-000000000002'),
       ('b1000000-0000-0000-0000-000000000003');

-- Words w01..w12: w01..w10 in set one, w11 (+ shared w01) in set two, w12 only in the draft set.
insert into public.words (id, slug, lemma, part_of_speech, ipa, meaning_en, meaning_vi, examples,
                          collocations, common_mistakes, level, topics)
select ('c1000000-0000-0000-0000-0000000000' || lpad(n::text, 2, '0'))::uuid,
       'test-word-' || n, 'word' || n, 'noun', '/w/', 'meaning', 'nghĩa',
       '[]', '[]', '[]', 'B1', array['education']
from generate_series(1, 12) as n;
insert into public.vocabulary_set_words (set_id, word_id, position)
select 'b1000000-0000-0000-0000-000000000001',
       ('c1000000-0000-0000-0000-0000000000' || lpad(n::text, 2, '0'))::uuid, n
from generate_series(1, 10) as n;
insert into public.vocabulary_set_words (set_id, word_id, position)
values ('b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 1),
       ('b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000011', 2),
       ('b1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000012', 1);

-- Learner C: review logs at fixed times for the weekly goal (Asia/Ho_Chi_Minh, UTC+7).
insert into public.user_words (user_id, word_id, status, introduced_at, due_at)
values ('a1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001',
        'learning', now(), now());
insert into public.review_logs (user_id, word_id, grade, exercise, interval_before, interval_after, reviewed_at)
values
  -- Sunday 23:30 local: previous week.
  ('a1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001', 'good', 'recall', 0, 1, '2026-11-08 16:30+00'),
  -- Monday 10:00 local, and Wednesday twice.
  ('a1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001', 'good', 'recall', 0, 1, '2026-11-09 03:00+00'),
  ('a1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001', 'good', 'recall', 0, 1, '2026-11-11 03:00+00'),
  ('a1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001', 'good', 'recall', 0, 1, '2026-11-11 04:00+00');

select is(public.review_days_in_week('a1000000-0000-0000-0000-000000000003', '2026-11-12 05:00+00'), 2,
  'the weekly goal counts distinct local days this week, not last Sunday night');
select is(public.review_days_in_week('a1000000-0000-0000-0000-000000000002', '2026-11-12 05:00+00'), 0,
  'no reviews means zero days');

create temporary table ids (name text primary key, id uuid) on commit drop;
grant all on ids to authenticated;

-- As learner A ----------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "a1000000-0000-0000-0000-000000000001", "role": "authenticated"}', true);

select is((select count(*)::int from public.words where slug like 'test-word-%'), 11,
  'words of published sets are visible, draft-only words are not');
select is((select count(*)::int from public.vocabulary_sets
           where id::text like 'b1000000-%'), 2, 'draft vocabulary sets are hidden');

select is(public.add_set_to_my_words('b1000000-0000-0000-0000-000000000001'), 10, 'adding a set adds its words');
select is(public.add_set_to_my_words('b1000000-0000-0000-0000-000000000001'), 0, 'adding it again adds nothing');
select is(public.add_set_to_my_words('b1000000-0000-0000-0000-000000000002'), 1, 'a shared word is not added twice');
select is((select count(*)::int from public.user_words), 11, 'one SRS record per word');
select throws_ok($$ select public.add_set_to_my_words('b1000000-0000-0000-0000-000000000003') $$,
  'P0001', 'set_not_found', 'draft sets cannot be added');
select is(public.add_word_to_my_words('c1000000-0000-0000-0000-000000000011'), false,
  'adding a word already in My words returns false');

select throws_ok(
  $$ insert into public.user_words (user_id, word_id, status)
     values ('a1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000012', 'new') $$,
  '42501', null, 'learners cannot write SRS records directly');
select throws_ok($$ update public.user_words set interval_days = 99 $$, '42501', null,
  'learners cannot change their schedule directly');

update public.profiles set daily_new_words = 5 where id = 'a1000000-0000-0000-0000-000000000001';
insert into ids select 'intro-' || row_number() over (), w from public.introduce_new_words() as w;
select is((select count(*)::int from ids where name like 'intro-%'), 5, 'the daily limit decides how many words are introduced');
select is((select count(*)::int from public.introduce_new_words()), 0, 'no more new words today');
select is(
  (select count(*)::int from public.user_words where status = 'learning' and due_at <= now()), 5,
  'introduced words are due even if the session is abandoned');
select is(
  (select array_agg(w.slug order by w.slug) from public.user_words uw join public.words w on w.id = uw.word_id
   where uw.status = 'learning'),
  array['test-word-1', 'test-word-2', 'test-word-3', 'test-word-4', 'test-word-5'],
  'the oldest words are introduced first, in set order');

-- SM-2 scheduling.
select lives_ok($$ select public.review_word('c1000000-0000-0000-0000-000000000001', 'good', 'intro', 0) $$, 'grade good');
select results_eq($$ select interval_days, repetitions from public.user_words where word_id = 'c1000000-0000-0000-0000-000000000001' $$,
  $$ values (1, 1) $$, 'good from repetition 0 schedules 1 day');
select lives_ok($$ select public.review_word('c1000000-0000-0000-0000-000000000001', 'good', 'match', 1) $$, 'grade good again');
select is((select interval_days from public.user_words where word_id = 'c1000000-0000-0000-0000-000000000001'), 3,
  'good from repetition 1 schedules 3 days');
select lives_ok($$ select public.review_word('c1000000-0000-0000-0000-000000000001', 'easy', 'cloze', 2) $$, 'grade easy');
select results_eq($$ select interval_days, ease from public.user_words where word_id = 'c1000000-0000-0000-0000-000000000001' $$,
  $$ values (10, 2.65::numeric(4,2)) $$, 'easy multiplies interval by ease and 1.3, and raises ease');
select lives_ok($$ select public.review_word('c1000000-0000-0000-0000-000000000002', 'again', 'recall', 0) $$, 'grade again');
select results_eq(
  $$ select interval_days, lapses, ease, due_at <= now() + interval '10 minutes' from public.user_words
     where word_id = 'c1000000-0000-0000-0000-000000000002' $$,
  $$ values (0, 1, 2.30::numeric(4,2), true) $$, 'again resets the interval and lowers ease');

select lives_ok($$ select public.review_word('c1000000-0000-0000-0000-000000000003', 'good', 'recall', 0) $$, 'first grade');
select throws_ok($$ select public.review_word('c1000000-0000-0000-0000-000000000003', 'again', 'recall', 0) $$,
  'P0001', 'stale_review', 'a double grade is rejected');
select throws_ok($$ select public.review_word('c1000000-0000-0000-0000-000000000010', 'good', 'recall', 0) $$,
  'P0001', 'word_not_introduced', 'new words must be introduced first');

select public.finish_review_session(now() - interval '1 minute');
select public.finish_review_session(now() - interval '1 minute');
select is(
  (select count(*)::int from public.activity_events where type = 'vocabulary.review_session'), 1,
  'finishing a session records one event, even if called twice');
select is(public.weekly_review_days(), 1, 'reviews today count toward the weekly goal');

select throws_ok($$ select public.new_word_allowance('a1000000-0000-0000-0000-000000000001', now()) $$,
  '42501', null, 'learners cannot call the allowance helper');

-- As learner B ----------------------------------------------------------------------------
select set_config('request.jwt.claims',
  '{"sub": "a1000000-0000-0000-0000-000000000002", "role": "authenticated"}', true);
select is((select count(*)::int from public.user_words) + (select count(*)::int from public.review_logs), 0,
  'learners cannot see other learners'' words or reviews');

-- Local midnight (as the owner, with fixed times) -----------------------------------------
reset role;
update public.user_words set introduced_at = '2026-11-08 16:50+00'
where user_id = 'a1000000-0000-0000-0000-000000000001' and status = 'learning';
select results_eq(
  $$ select public.new_word_allowance('a1000000-0000-0000-0000-000000000001', '2026-11-08 16:55+00'),
            public.new_word_allowance('a1000000-0000-0000-0000-000000000001', '2026-11-08 17:05+00') $$,
  $$ values (0, 5) $$,
  'words introduced at 23:50 local count for that day; the allowance resets at local midnight');

select * from finish();
rollback;
