-- P4 Reading: several passages per practice set, full tests and passage key words.
-- See docs/superpowers/specs/2026-11-09-p4-reading-design.md.

-- ---------------------------------------------------------------------------
-- Passages (a full test has three)
-- ---------------------------------------------------------------------------
create table public.practice_set_passages (
  id uuid primary key default gen_random_uuid(),
  practice_set_id uuid not null references public.practice_sets (id) on delete cascade,
  position integer not null check (position >= 1),
  title text check (title is null or char_length(title) <= 200),
  text text not null check (char_length(text) between 1 and 20000),
  unique (practice_set_id, position)
);

comment on table public.practice_set_passages is
  'Reading passages of a practice set. Evidence offsets in question_keys are relative to the passage of the question''s group.';

-- Existing single passages become passage 1 of their set.
insert into public.practice_set_passages (practice_set_id, position, title, text)
select id, 1, passage_title, passage_text
from public.practice_sets
where passage_text is not null;

alter table public.question_groups
  add column passage_id uuid references public.practice_set_passages (id) on delete set null;

update public.question_groups g
set passage_id = p.id
from public.practice_set_passages p
where p.practice_set_id = g.practice_set_id and p.position = 1;

alter table public.practice_sets drop column passage_title;
alter table public.practice_sets drop column passage_text;

alter table public.practice_sets
  add column kind text not null default 'practice' check (kind in ('practice', 'full_test'));

alter table public.practice_set_passages enable row level security;

create policy "practice_set_passages: learners read published"
on public.practice_set_passages for select to authenticated
using (public.is_published_content(practice_set_id));

revoke all on public.practice_set_passages from anon, authenticated;
grant select on public.practice_set_passages to authenticated;

-- ---------------------------------------------------------------------------
-- Passage key words (READ-06): shared with the vocabulary words table
-- ---------------------------------------------------------------------------
create table public.practice_set_words (
  practice_set_id uuid not null references public.practice_sets (id) on delete cascade,
  word_id uuid not null references public.words (id) on delete cascade,
  passage_id uuid not null references public.practice_set_passages (id) on delete cascade,
  -- The exact form in the passage that is underlined (its first occurrence).
  form text not null check (char_length(form) between 1 and 80),
  primary key (practice_set_id, word_id)
);

create index practice_set_words_word_idx on public.practice_set_words (word_id);

alter table public.practice_set_words enable row level security;

create policy "practice_set_words: learners read published"
on public.practice_set_words for select to authenticated
using (public.is_published_content(practice_set_id));

revoke all on public.practice_set_words from anon, authenticated;
grant select on public.practice_set_words to authenticated;

-- A word is visible when a published vocabulary set or a published practice set uses it.
create or replace function public.is_published_word(target_word_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.vocabulary_set_words vsw
    join public.content_items ci on ci.id = vsw.set_id
    where vsw.word_id = target_word_id and ci.review_status = 'published'
  ) or exists (
    select 1 from public.practice_set_words psw
    join public.content_items ci on ci.id = psw.practice_set_id
    where psw.word_id = target_word_id and ci.review_status = 'published'
  );
$$;
