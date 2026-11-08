-- Reading passages, set kind and passage key words (P4). Run with: pnpm db:test
begin;
create extension if not exists pgtap with schema extensions;

select plan(8);

insert into auth.users (id, instance_id, aud, role, email)
values ('99999999-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000',
        'authenticated', 'authenticated', 'reader@example.test');

insert into public.content_items (id, type, slug, title, level, source, review_status)
values
  ('98000000-0000-0000-0000-000000000001', 'practice_set', 'test-p4-published', 'Published', 'B2', 'original', 'published'),
  ('98000000-0000-0000-0000-000000000002', 'practice_set', 'test-p4-draft', 'Draft', 'B2', 'original', 'draft');

insert into public.practice_sets (id, module, kind)
values ('98000000-0000-0000-0000-000000000001', 'reading', 'full_test'),
       ('98000000-0000-0000-0000-000000000002', 'reading', 'practice');

insert into public.practice_set_passages (id, practice_set_id, position, title, text)
values
  ('97000000-0000-0000-0000-000000000001', '98000000-0000-0000-0000-000000000001', 1, 'One', 'Vegetation cools roofs.'),
  ('97000000-0000-0000-0000-000000000002', '98000000-0000-0000-0000-000000000002', 1, 'Draft', 'Secret draft text.');

insert into public.question_groups (id, practice_set_id, passage_id, position, question_type, instructions)
values ('96000000-0000-0000-0000-000000000001', '98000000-0000-0000-0000-000000000001',
        '97000000-0000-0000-0000-000000000001', 1, 'short_answer', 'Answer.');

insert into public.words (id, slug, lemma, part_of_speech, meaning_en, meaning_vi, level, topics)
values
  ('95000000-0000-0000-0000-000000000001', 'test-vegetation', 'vegetation', 'noun', 'plants', 'thảm thực vật', 'B2', array['environment']),
  ('95000000-0000-0000-0000-000000000002', 'test-secret', 'secret', 'noun', 'hidden', 'bí mật', 'B2', array['environment']);

insert into public.practice_set_words (practice_set_id, word_id, passage_id, form)
values
  ('98000000-0000-0000-0000-000000000001', '95000000-0000-0000-0000-000000000001', '97000000-0000-0000-0000-000000000001', 'Vegetation'),
  ('98000000-0000-0000-0000-000000000002', '95000000-0000-0000-0000-000000000002', '97000000-0000-0000-0000-000000000002', 'Secret');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "99999999-0000-0000-0000-000000000001", "role": "authenticated"}', true);

select is((select count(*)::int from public.practice_set_passages where id::text like '97000000-%'), 1,
  'learners see passages of published sets only');
select is((select title from public.practice_set_passages where id = '97000000-0000-0000-0000-000000000001'), 'One',
  'the published passage is readable');
select is((select count(*)::int from public.words where slug like 'test-%'), 1,
  'a passage key word of a published set is visible; a draft set''s is not');
select is((select count(*)::int from public.practice_set_words where word_id::text like '95000000-%'), 1,
  'key word links of draft sets are hidden');
select is((select passage_id from public.question_groups where id = '96000000-0000-0000-0000-000000000001'),
  '97000000-0000-0000-0000-000000000001'::uuid, 'question groups point to their passage');
select is((select kind from public.practice_sets where id = '98000000-0000-0000-0000-000000000001'), 'full_test',
  'the set kind is readable');
select throws_ok(
  $$ insert into public.practice_set_passages (id, practice_set_id, position, text)
     values (gen_random_uuid(), '98000000-0000-0000-0000-000000000001', 2, 'x') $$,
  '42501', null, 'learners cannot write passages');

reset role;
select throws_ok(
  $$ update public.practice_sets set kind = 'quiz' where id = '98000000-0000-0000-0000-000000000002' $$,
  '23514', null, 'kind accepts practice or full_test only');

select * from finish();
rollback;
