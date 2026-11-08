-- P2 Content & practice engine: content catalogue, practice sets with questions, hidden answer
-- keys, attempts and answers. See docs/decisions/0007-content-and-practice-engine.md.
--
-- Security model
--   * Learners read only published content. Answer keys are never readable by learners; they are
--     revealed per question only through get_attempt_review() after the learner's own attempt is
--     submitted.
--   * Attempts and answers are written only through the security-definer functions below, which
--     check ownership and use server time for deadlines. Learners can read their own rows.
--   * Content is written by migrations / the content seed (pnpm content:seed), not by learners.

-- ---------------------------------------------------------------------------
-- Content catalogue
-- ---------------------------------------------------------------------------
create table public.content_items (
  id uuid primary key,
  type text not null check (type in ('practice_set')),
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  title text not null check (char_length(title) between 1 and 160),
  summary text check (summary is null or char_length(summary) <= 500),
  level text not null check (level in ('A2', 'B1', 'B2', 'C1')),
  topics text[] not null default '{}' check (
    topics <@ array[
      'education', 'environment', 'technology', 'health', 'work', 'society', 'culture',
      'media', 'cities', 'science'
    ]::text[]
  ),
  source text not null check (source in ('original', 'licensed', 'ai_assisted')),
  review_status text not null default 'draft'
    check (review_status in ('draft', 'reviewed', 'published')),
  version integer not null default 1 check (version >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.content_items is
  'Learning content catalogue. Only published items are visible to learners (decision D-04).';

create trigger content_items_set_updated_at
before update on public.content_items
for each row execute function public.set_updated_at();

create table public.practice_sets (
  id uuid primary key references public.content_items (id) on delete cascade,
  module text not null check (module in ('reading', 'listening', 'grammar')),
  -- Test mode is offered only when a time limit is set.
  test_time_limit_seconds integer
    check (test_time_limit_seconds is null or test_time_limit_seconds between 60 and 7200),
  passage_title text check (passage_title is null or char_length(passage_title) <= 200),
  passage_text text check (passage_text is null or char_length(passage_text) <= 20000)
);

comment on table public.practice_sets is 'Question sets for Reading, Listening and Grammar practice.';

create index practice_sets_module_idx on public.practice_sets (module);

create table public.question_groups (
  id uuid primary key,
  practice_set_id uuid not null references public.practice_sets (id) on delete cascade,
  position integer not null check (position >= 1),
  question_type text not null check (
    question_type in (
      'true_false_not_given', 'yes_no_not_given', 'multiple_choice', 'multiple_choice_multi',
      'matching_headings', 'matching_information', 'matching_features',
      'sentence_completion', 'summary_completion', 'short_answer', 'gap_fill'
    )
  ),
  instructions text not null check (char_length(instructions) between 1 and 1000),
  -- Options shared by every question in the group (e.g. a list of headings): [{id, text}].
  options jsonb check (options is null or jsonb_typeof(options) = 'array'),
  unique (practice_set_id, position)
);

create table public.questions (
  id uuid primary key,
  practice_set_id uuid not null references public.practice_sets (id) on delete cascade,
  group_id uuid not null references public.question_groups (id) on delete cascade,
  position integer not null check (position >= 1),
  -- Number shown to the learner (1..40 in a full test).
  number integer not null check (number between 1 and 200),
  prompt text not null check (char_length(prompt) between 1 and 1000),
  -- Options for this question only: [{id, text}]. Choice questions use these or the group's.
  options jsonb check (options is null or jsonb_typeof(options) = 'array'),
  response_kind text not null check (response_kind in ('single', 'multiple', 'text')),
  -- 'multiple': how many options to choose; each correct choice is one mark.
  select_count integer check (select_count is null or select_count between 2 and 5),
  -- 'text': word limit shown to the learner ("NO MORE THAN TWO WORDS").
  max_words integer check (max_words is null or max_words between 1 and 10),
  check ((response_kind = 'multiple') = (select_count is not null)),
  check (response_kind = 'text' or max_words is null),
  unique (group_id, position),
  unique (practice_set_id, number)
);

create index questions_practice_set_idx on public.questions (practice_set_id);

-- Answer keys live apart from questions so learners can read questions but never keys.
create table public.question_keys (
  question_id uuid primary key references public.questions (id) on delete cascade,
  -- Accepted answers: option ids for choice questions, accepted variants for text questions.
  accepted jsonb not null
    check (jsonb_typeof(accepted) = 'array' and jsonb_array_length(accepted) >= 1),
  explanation text not null check (char_length(explanation) between 1 and 2000),
  explanation_vi text check (explanation_vi is null or char_length(explanation_vi) <= 2000),
  -- Evidence location in practice_sets.passage_text as a [start, end) range of JavaScript
  -- (UTF-16) string offsets, computed by the content seed and used by the app to slice.
  evidence_start integer,
  evidence_end integer,
  check ((evidence_start is null) = (evidence_end is null)),
  check (evidence_start is null or (evidence_start >= 0 and evidence_end > evidence_start))
);

-- Read access: published content only. Policies on child tables check the parent set.
create function public.is_published_practice_set(set_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.content_items ci
    where ci.id = set_id and ci.review_status = 'published'
  );
$$;

alter table public.content_items enable row level security;
alter table public.practice_sets enable row level security;
alter table public.question_groups enable row level security;
alter table public.questions enable row level security;
alter table public.question_keys enable row level security;

create policy "content_items: learners read published"
on public.content_items for select
to authenticated
using (review_status = 'published');

create policy "practice_sets: learners read published"
on public.practice_sets for select
to authenticated
using (public.is_published_practice_set(id));

create policy "question_groups: learners read published"
on public.question_groups for select
to authenticated
using (public.is_published_practice_set(practice_set_id));

create policy "questions: learners read published"
on public.questions for select
to authenticated
using (public.is_published_practice_set(practice_set_id));

-- question_keys: RLS on and no policy or grant, so learners cannot read keys at all.
revoke all on public.content_items, public.practice_sets, public.question_groups,
  public.questions, public.question_keys from anon, authenticated;
grant select on public.content_items, public.practice_sets, public.question_groups,
  public.questions to authenticated;

-- ---------------------------------------------------------------------------
-- Attempts and answers
-- ---------------------------------------------------------------------------
create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  practice_set_id uuid not null references public.practice_sets (id) on delete restrict,
  content_version integer not null,
  mode text not null check (mode in ('learn', 'test')),
  status text not null default 'in_progress' check (status in ('in_progress', 'submitted')),
  started_at timestamptz not null default now(),
  -- Test mode only: started_at + the set's time limit (server time).
  deadline_at timestamptz,
  submitted_at timestamptz,
  submit_reason text check (submit_reason in ('learner', 'time_expired')),
  score integer check (score >= 0),
  max_score integer check (max_score >= 0),
  check ((mode = 'test') = (deadline_at is not null)),
  check (
    (status = 'in_progress' and submitted_at is null and submit_reason is null and score is null)
    or (status = 'submitted' and submitted_at is not null and submit_reason is not null
        and score is not null and max_score is not null)
  )
);

comment on table public.attempts is 'A learner''s attempt at a practice set (practice engine).';

-- One active attempt per learner and set (READ business rule).
create unique index attempts_one_active_per_set_idx
on public.attempts (user_id, practice_set_id) where status = 'in_progress';

create index attempts_user_started_idx on public.attempts (user_id, started_at desc);

create table public.attempt_answers (
  attempt_id uuid not null references public.attempts (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  -- Selected option ids, or a single text answer: always an array of strings.
  response jsonb not null default '[]'::jsonb check (jsonb_typeof(response) = 'array'),
  is_correct boolean,
  points integer check (points >= 0),
  updated_at timestamptz not null default now(),
  primary key (attempt_id, question_id)
);

alter table public.attempts enable row level security;
alter table public.attempt_answers enable row level security;

create policy "attempts: owner can read"
on public.attempts for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "attempt_answers: owner can read"
on public.attempt_answers for select
to authenticated
using (
  exists (
    select 1 from public.attempts a
    where a.id = attempt_id and a.user_id = (select auth.uid())
  )
);

-- Writes only through the functions below.
revoke all on public.attempts, public.attempt_answers from anon, authenticated;
grant select on public.attempts, public.attempt_answers to authenticated;

-- ---------------------------------------------------------------------------
-- Engine functions
-- Errors use SQLSTATE P0001 with a stable message the app maps to user-facing text:
--   not_authenticated, set_not_found, test_mode_unavailable, attempt_not_found,
--   attempt_submitted, attempt_expired, question_not_found, invalid_response
-- ---------------------------------------------------------------------------

-- Normalises a text answer: trimmed, single spaces, lower case. Spelling must still match.
create function public.normalize_text_answer(value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select lower(regexp_replace(btrim(value), '\s+', ' ', 'g'));
$$;

-- Scores and closes an attempt. Internal: callers have already checked ownership.
create function public.finalize_attempt(target_attempt_id uuid, reason text)
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

  with scored as (
    select
      aa.question_id,
      case q.response_kind
        when 'single' then
          case when jsonb_array_length(aa.response) = 1 and k.accepted @> aa.response
               then 1 else 0 end
        when 'text' then
          case when jsonb_array_length(aa.response) = 1 and exists (
                 select 1 from jsonb_array_elements_text(k.accepted) as variant(value)
                 where public.normalize_text_answer(variant.value)
                       = public.normalize_text_answer(aa.response ->> 0)
               ) then 1 else 0 end
        else (
          -- 'multiple': one mark per distinct correct option, at most select_count.
          select least(count(distinct chosen.value), q.select_count)::int
          from jsonb_array_elements_text(aa.response) as chosen(value)
          where k.accepted ? chosen.value
        )
      end as points,
      case when q.response_kind = 'multiple' then q.select_count else 1 end as marks
    from public.attempt_answers aa
    join public.questions q on q.id = aa.question_id
    join public.question_keys k on k.question_id = q.id
    where aa.attempt_id = target.id
  )
  update public.attempt_answers aa
  set points = scored.points,
      is_correct = scored.points = scored.marks
  from scored
  where aa.attempt_id = target.id and aa.question_id = scored.question_id;

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

-- Starts an attempt, or returns the learner's active attempt for the set.
-- An active attempt whose deadline has passed is submitted first, then a new one starts.
create function public.start_attempt(target_set_id uuid, attempt_mode text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  set_version integer;
  time_limit integer;
  active public.attempts;
  new_id uuid;
begin
  if current_user_id is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;
  if attempt_mode is null or attempt_mode not in ('learn', 'test') then
    raise exception 'invalid_response' using errcode = 'P0001';
  end if;

  -- Serialise starts per learner and set, so a double click or two tabs resume the same
  -- attempt instead of racing on the one-active-attempt index.
  perform pg_advisory_xact_lock(
    hashtextextended(current_user_id::text || ':' || coalesce(target_set_id::text, ''), 0)
  );

  select ci.version, ps.test_time_limit_seconds into set_version, time_limit
  from public.practice_sets ps
  join public.content_items ci on ci.id = ps.id
  where ps.id = target_set_id and ci.review_status = 'published';
  if not found then
    raise exception 'set_not_found' using errcode = 'P0001';
  end if;

  select * into active
  from public.attempts
  where user_id = current_user_id and practice_set_id = target_set_id and status = 'in_progress'
  for update;

  if found then
    if active.deadline_at is null or active.deadline_at > now() then
      return active.id;
    end if;
    perform public.finalize_attempt(active.id, 'time_expired');
  end if;

  if attempt_mode = 'test' and time_limit is null then
    raise exception 'test_mode_unavailable' using errcode = 'P0001';
  end if;

  insert into public.attempts (user_id, practice_set_id, content_version, mode, deadline_at)
  values (
    current_user_id,
    target_set_id,
    set_version,
    attempt_mode,
    case when attempt_mode = 'test' then now() + make_interval(secs => time_limit) end
  )
  returning id into new_id;

  return new_id;
end;
$$;

-- Saves (upserts) the learner's answer to one question of an active attempt.
create function public.save_answer(target_attempt_id uuid, target_question_id uuid, answer jsonb)
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

  -- Shared lock: saves run alongside each other, but wait for (and then see) a concurrent
  -- submit, whose FOR UPDATE in finalize_attempt in turn waits for in-flight saves. So an
  -- answer can never change after the attempt is scored.
  select * into target from public.attempts
  where id = target_attempt_id and user_id = current_user_id
  for share;
  if not found then
    raise exception 'attempt_not_found' using errcode = 'P0001';
  end if;
  if target.status = 'submitted' then
    raise exception 'attempt_submitted' using errcode = 'P0001';
  end if;
  -- A short grace period absorbs network latency for answers sent just before the deadline.
  if target.deadline_at is not null and now() > target.deadline_at + interval '5 seconds' then
    raise exception 'attempt_expired' using errcode = 'P0001';
  end if;

  select * into question from public.questions
  where id = target_question_id and practice_set_id = target.practice_set_id;
  if not found then
    raise exception 'question_not_found' using errcode = 'P0001';
  end if;

  max_items := case question.response_kind
    when 'multiple' then question.select_count
    else 1
  end;

  -- Shape: an array of at most max_items strings, each 1..200 characters. The length is
  -- checked first so oversized arrays are rejected before their elements are scanned.
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
  do update set response = excluded.response, updated_at = excluded.updated_at;
end;
$$;

-- Submits the learner's attempt. Idempotent: submitting twice keeps the first result.
-- After the deadline, the reason is recorded as time_expired.
create function public.submit_attempt(target_attempt_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  target public.attempts;
begin
  if current_user_id is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;

  select * into target from public.attempts
  where id = target_attempt_id and user_id = current_user_id;
  if not found then
    raise exception 'attempt_not_found' using errcode = 'P0001';
  end if;

  perform public.finalize_attempt(
    target.id,
    case when target.deadline_at is not null and now() > target.deadline_at
         then 'time_expired' else 'learner' end
  );
end;
$$;

-- Answer keys and explanations for the learner's own submitted attempt.
create function public.get_attempt_review(target_attempt_id uuid)
returns table (
  question_id uuid,
  accepted jsonb,
  explanation text,
  explanation_vi text,
  evidence_start integer,
  evidence_end integer
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
  select k.question_id, k.accepted, k.explanation, k.explanation_vi, k.evidence_start, k.evidence_end
  from public.question_keys k
  join public.questions q on q.id = k.question_id
  join public.attempts a on a.practice_set_id = q.practice_set_id
  where a.id = target_attempt_id;
end;
$$;

-- Public API for learners; helpers stay private.
revoke execute on function public.start_attempt(uuid, text) from public, anon;
revoke execute on function public.save_answer(uuid, uuid, jsonb) from public, anon;
revoke execute on function public.submit_attempt(uuid) from public, anon;
revoke execute on function public.get_attempt_review(uuid) from public, anon;
grant execute on function public.start_attempt(uuid, text) to authenticated;
grant execute on function public.save_answer(uuid, uuid, jsonb) to authenticated;
grant execute on function public.submit_attempt(uuid) to authenticated;
grant execute on function public.get_attempt_review(uuid) to authenticated;

revoke execute on function public.finalize_attempt(uuid, text) from public, anon, authenticated;
revoke execute on function public.is_published_practice_set(uuid) from public, anon;
grant execute on function public.is_published_practice_set(uuid) to authenticated;
revoke execute on function public.normalize_text_answer(text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Engine events are written only by finalize_attempt (as the table owner, which bypasses RLS).
-- Learners may still append their own other events, but cannot forge attempt results.
-- ---------------------------------------------------------------------------
drop policy "activity_events: owner can append" on public.activity_events;

create policy "activity_events: owner can append"
on public.activity_events for insert
to authenticated
with check ((select auth.uid()) = user_id and type not like 'attempt.%');
