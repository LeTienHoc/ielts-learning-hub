-- P3 grammar: grammar topics, two new question types and a learn-mode instant check on the
-- P2 practice engine. See docs/superpowers/specs/2026-11-08-p3-vocabulary-grammar-design.md §5.3.

-- ---------------------------------------------------------------------------
-- Catalogue and question types
-- ---------------------------------------------------------------------------
alter table public.content_items drop constraint content_items_type_check;
alter table public.content_items add constraint content_items_type_check
  check (type in ('practice_set', 'vocabulary_set', 'grammar_topic'));

-- error_correction ("Spot the mistake"): response kind 'single'; options are the sentence's
-- word tokens and the accepted id is the wrong one. sentence_transformation: kind 'text'.
alter table public.question_groups drop constraint question_groups_question_type_check;
alter table public.question_groups add constraint question_groups_question_type_check
  check (
    question_type in (
      'true_false_not_given', 'yes_no_not_given', 'multiple_choice', 'multiple_choice_multi',
      'matching_headings', 'matching_information', 'matching_features',
      'sentence_completion', 'summary_completion', 'short_answer', 'gap_fill',
      'error_correction', 'sentence_transformation'
    )
  );

-- The corrected sentence shown after a "Spot the mistake" item.
alter table public.question_keys
  add column correction text check (correction is null or char_length(correction) <= 1000);

-- Set when an answer is checked instantly; a checked answer is locked.
alter table public.attempt_answers add column checked_at timestamptz;

create function public.is_published_content(item_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.content_items ci
    where ci.id = item_id and ci.review_status = 'published'
  );
$$;

revoke execute on function public.is_published_content(uuid) from public, anon;
grant execute on function public.is_published_content(uuid) to authenticated;

create table public.grammar_topics (
  id uuid primary key references public.content_items (id) on delete cascade,
  position integer not null check (position >= 1),
  -- Lesson blocks (intro, sections, common mistakes, IELTS tip) in EN + VI; validated by the
  -- content schema (src/lib/content/grammar-schema.ts) before seeding.
  lesson jsonb not null check (jsonb_typeof(lesson) = 'object'),
  practice_set_id uuid references public.practice_sets (id) on delete set null
);

comment on table public.grammar_topics is 'Grammar lessons; practice uses the P2 engine (module grammar).';

alter table public.grammar_topics enable row level security;

create policy "grammar_topics: learners read published"
on public.grammar_topics for select
to authenticated
using (public.is_published_content(id));

revoke all on public.grammar_topics from anon, authenticated;
grant select on public.grammar_topics to authenticated;

-- ---------------------------------------------------------------------------
-- Scoring helper shared by finalize_attempt and check_answer
-- ---------------------------------------------------------------------------
create function public.score_answer(target_question_id uuid, answer jsonb)
returns integer
language sql
stable
set search_path = ''
as $$
  select case q.response_kind
    when 'single' then
      case when jsonb_array_length(answer) = 1 and k.accepted @> answer then 1 else 0 end
    when 'text' then
      case when jsonb_array_length(answer) = 1 and exists (
             select 1 from jsonb_array_elements_text(k.accepted) as variant(value)
             where public.normalize_text_answer(variant.value)
                   = public.normalize_text_answer(answer ->> 0)
           ) then 1 else 0 end
    else (
      -- 'multiple': one mark per distinct correct option, at most select_count.
      select least(count(distinct chosen.value), q.select_count)::int
      from jsonb_array_elements_text(answer) as chosen(value)
      where k.accepted ? chosen.value
    )
  end
  from public.questions q
  join public.question_keys k on k.question_id = q.id
  where q.id = target_question_id;
$$;

revoke execute on function public.score_answer(uuid, jsonb) from public, anon, authenticated;

create or replace function public.finalize_attempt(target_attempt_id uuid, reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.attempts;
  set_module text;
  total_score integer;
  total_max integer;
begin
  select * into target from public.attempts where id = target_attempt_id for update;
  if target.status = 'submitted' then
    return;
  end if;

  -- Questions without an answer row count as unanswered.
  insert into public.attempt_answers (attempt_id, question_id)
  select target.id, q.id
  from public.questions q
  where q.practice_set_id = target.practice_set_id
  on conflict (attempt_id, question_id) do nothing;

  -- Rescoring checked answers gives the same result they were shown.
  update public.attempt_answers aa
  set points = public.score_answer(aa.question_id, aa.response),
      is_correct = public.score_answer(aa.question_id, aa.response)
                   = case when q.response_kind = 'multiple' then q.select_count else 1 end
  from public.questions q
  where aa.attempt_id = target.id and q.id = aa.question_id;

  select coalesce(sum(aa.points), 0)::int,
         coalesce(sum(case when q.response_kind = 'multiple' then q.select_count else 1 end), 0)::int
  into total_score, total_max
  from public.attempt_answers aa
  join public.questions q on q.id = aa.question_id
  where aa.attempt_id = target.id;

  update public.attempts
  set status = 'submitted',
      submitted_at = now(),
      submit_reason = reason,
      score = total_score,
      max_score = total_max
  where id = target.id;

  select module into set_module from public.practice_sets where id = target.practice_set_id;

  insert into public.activity_events (user_id, type, module, ref_type, ref_id, duration_seconds, metadata)
  values (
    target.user_id,
    'attempt.submitted',
    set_module,
    'practice_set',
    target.practice_set_id::text,
    least(greatest(extract(epoch from now() - target.started_at)::int, 0), 86400),
    jsonb_build_object(
      'attempt_id', target.id,
      'mode', target.mode,
      'score', total_score,
      'max_score', total_max,
      'reason', reason
    )
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- save_answer: unchanged except that a checked answer is locked
-- ---------------------------------------------------------------------------
create or replace function public.save_answer(target_attempt_id uuid, target_question_id uuid, answer jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  target public.attempts;
  question public.questions;
  group_options jsonb;
  allowed_ids jsonb;
  max_items integer;
begin
  if current_user_id is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;

  -- Shared lock: saves wait for (and then see) a concurrent submit. See the P2 migration.
  select * into target from public.attempts
  where id = target_attempt_id and user_id = current_user_id
  for share;
  if not found then
    raise exception 'attempt_not_found' using errcode = 'P0001';
  end if;
  if target.status = 'submitted' then
    raise exception 'attempt_submitted' using errcode = 'P0001';
  end if;
  if target.deadline_at is not null and now() > target.deadline_at + interval '5 seconds' then
    raise exception 'attempt_expired' using errcode = 'P0001';
  end if;

  select * into question from public.questions
  where id = target_question_id and practice_set_id = target.practice_set_id;
  if not found then
    raise exception 'question_not_found' using errcode = 'P0001';
  end if;

  if exists (
    select 1 from public.attempt_answers aa
    where aa.attempt_id = target.id and aa.question_id = question.id and aa.checked_at is not null
  ) then
    raise exception 'answer_locked' using errcode = 'P0001';
  end if;

  max_items := case question.response_kind
    when 'multiple' then question.select_count
    else 1
  end;

  if answer is null or jsonb_typeof(answer) <> 'array'
     or jsonb_array_length(answer) > max_items
     or exists (
       select 1 from jsonb_array_elements(answer) as item(value)
       where jsonb_typeof(item.value) <> 'string'
          or char_length(item.value #>> '{}') not between 1 and 200
     ) then
    raise exception 'invalid_response' using errcode = 'P0001';
  end if;

  if question.response_kind in ('single', 'multiple') then
    select options into group_options from public.question_groups where id = question.group_id;
    select coalesce(jsonb_agg(option_item ->> 'id'), '[]'::jsonb) into allowed_ids
    from jsonb_array_elements(coalesce(question.options, group_options, '[]'::jsonb)) as opt(option_item);
    if not allowed_ids @> answer
       or (select count(distinct v) from jsonb_array_elements_text(answer) as t(v))
          <> jsonb_array_length(answer) then
      raise exception 'invalid_response' using errcode = 'P0001';
    end if;
  end if;

  insert into public.attempt_answers (attempt_id, question_id, response, updated_at)
  values (target.id, question.id, answer, now())
  on conflict (attempt_id, question_id)
  do update set response = excluded.response, updated_at = excluded.updated_at
  where public.attempt_answers.checked_at is null;
end;
$$;

-- ---------------------------------------------------------------------------
-- Instant check (learn mode): save, lock and reveal the key for one question
-- ---------------------------------------------------------------------------
create function public.check_answer(target_attempt_id uuid, target_question_id uuid, answer jsonb)
returns table (
  is_correct boolean,
  points integer,
  accepted jsonb,
  explanation text,
  explanation_vi text,
  correction text
)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  current_user_id uuid := auth.uid();
  target public.attempts;
  earned integer;
  marks integer;
begin
  if current_user_id is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;

  select * into target from public.attempts
  where id = target_attempt_id and user_id = current_user_id;
  if not found then
    raise exception 'attempt_not_found' using errcode = 'P0001';
  end if;
  if target.status = 'submitted' then
    raise exception 'attempt_submitted' using errcode = 'P0001';
  end if;
  if target.mode <> 'learn' then
    raise exception 'check_unavailable' using errcode = 'P0001';
  end if;

  -- Validates the answer, the question and the lock, and stores the answer.
  perform public.save_answer(target_attempt_id, target_question_id, answer);

  earned := public.score_answer(target_question_id, answer);
  select case when q.response_kind = 'multiple' then q.select_count else 1 end into marks
  from public.questions q where q.id = target_question_id;

  update public.attempt_answers aa
  set points = earned, is_correct = earned = marks, checked_at = now()
  where aa.attempt_id = target_attempt_id and aa.question_id = target_question_id;

  return query
  select earned = marks, earned, k.accepted, k.explanation, k.explanation_vi, k.correction
  from public.question_keys k
  where k.question_id = target_question_id;
end;
$$;

revoke execute on function public.check_answer(uuid, uuid, jsonb) from public, anon;
grant execute on function public.check_answer(uuid, uuid, jsonb) to authenticated;

-- The review now includes the corrected sentence (return type changes, so drop and recreate).
drop function public.get_attempt_review(uuid);

create function public.get_attempt_review(target_attempt_id uuid)
returns table (
  question_id uuid,
  accepted jsonb,
  explanation text,
  explanation_vi text,
  evidence_start integer,
  evidence_end integer,
  correction text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.attempts a
    where a.id = target_attempt_id
      and a.user_id = (select auth.uid())
      and a.status = 'submitted'
  ) then
    raise exception 'attempt_not_found' using errcode = 'P0001';
  end if;

  return query
  select k.question_id, k.accepted, k.explanation, k.explanation_vi, k.evidence_start,
         k.evidence_end, k.correction
  from public.question_keys k
  join public.questions q on q.id = k.question_id
  join public.attempts a on a.practice_set_id = q.practice_set_id
  where a.id = target_attempt_id;
end;
$$;

revoke execute on function public.get_attempt_review(uuid) from public, anon;
grant execute on function public.get_attempt_review(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Learning events are written only by definer functions (cannot be forged)
-- ---------------------------------------------------------------------------
drop policy "activity_events: owner can append" on public.activity_events;

create policy "activity_events: owner can append"
on public.activity_events for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and type not like 'attempt.%'
  and type not like 'vocabulary.%'
  and type not like 'grammar.%'
);
