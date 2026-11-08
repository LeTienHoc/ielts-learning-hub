-- P3 vocabulary: words, topic sets, My words and SM-2 style spaced repetition on server time.
-- See docs/superpowers/specs/2026-11-08-p3-vocabulary-grammar-design.md §5.1–5.2.

-- ---------------------------------------------------------------------------
-- Content: words and sets (published only)
-- ---------------------------------------------------------------------------
create table public.vocabulary_sets (
  id uuid primary key references public.content_items (id) on delete cascade
);

create table public.words (
  id uuid primary key,
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  lemma text not null check (char_length(lemma) between 1 and 80),
  part_of_speech text not null check (char_length(part_of_speech) between 1 and 30),
  ipa text check (ipa is null or char_length(ipa) <= 80),
  meaning_en text not null check (char_length(meaning_en) between 1 and 500),
  meaning_vi text not null check (char_length(meaning_vi) between 1 and 500),
  -- [{en, vi, cloze}], [string], [{wrong, right, whyEn, whyVi}]; validated by the content schema.
  examples jsonb not null default '[]' check (jsonb_typeof(examples) = 'array'),
  collocations jsonb not null default '[]' check (jsonb_typeof(collocations) = 'array'),
  common_mistakes jsonb not null default '[]' check (jsonb_typeof(common_mistakes) = 'array'),
  level text not null check (level in ('A2', 'B1', 'B2', 'C1')),
  topics text[] not null default '{}'
);

create table public.vocabulary_set_words (
  set_id uuid not null references public.vocabulary_sets (id) on delete cascade,
  word_id uuid not null references public.words (id) on delete cascade,
  position integer not null check (position >= 1),
  primary key (set_id, word_id),
  unique (set_id, position)
);

create index vocabulary_set_words_word_idx on public.vocabulary_set_words (word_id);

-- A word is visible when it belongs to at least one published set.
create function public.is_published_word(target_word_id uuid)
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
  );
$$;

revoke execute on function public.is_published_word(uuid) from public, anon;
grant execute on function public.is_published_word(uuid) to authenticated;

alter table public.vocabulary_sets enable row level security;
alter table public.words enable row level security;
alter table public.vocabulary_set_words enable row level security;

create policy "vocabulary_sets: learners read published"
on public.vocabulary_sets for select to authenticated
using (public.is_published_content(id));

create policy "vocabulary_set_words: learners read published"
on public.vocabulary_set_words for select to authenticated
using (public.is_published_content(set_id));

create policy "words: learners read published"
on public.words for select to authenticated
using (public.is_published_word(id));

revoke all on public.vocabulary_sets, public.words, public.vocabulary_set_words from anon, authenticated;
grant select on public.vocabulary_sets, public.words, public.vocabulary_set_words to authenticated;

-- ---------------------------------------------------------------------------
-- Learner settings and SRS state
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column daily_new_words integer not null default 10 check (daily_new_words in (5, 10, 15));
grant update (daily_new_words) on public.profiles to authenticated;

create table public.user_words (
  user_id uuid not null references auth.users (id) on delete cascade,
  word_id uuid not null references public.words (id) on delete cascade,
  status text not null default 'new' check (status in ('new', 'learning')),
  ease numeric(4, 2) not null default 2.50 check (ease >= 1.30),
  interval_days integer not null default 0 check (interval_days >= 0),
  repetitions integer not null default 0 check (repetitions >= 0),
  lapses integer not null default 0 check (lapses >= 0),
  -- Optimistic concurrency token: review_word must be called with the current value.
  review_count integer not null default 0 check (review_count >= 0),
  due_at timestamptz,
  added_at timestamptz not null default now(),
  -- Order in which words were added (set order within a set); new words are introduced in it.
  queue_order bigint generated always as identity,
  introduced_at timestamptz,
  primary key (user_id, word_id),
  check ((status = 'new') = (introduced_at is null)),
  check (status = 'new' or due_at is not null)
);

create index user_words_due_idx on public.user_words (user_id, due_at) where status = 'learning';

create table public.review_logs (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  word_id uuid not null references public.words (id) on delete cascade,
  grade text not null check (grade in ('again', 'hard', 'good', 'easy')),
  exercise text not null check (exercise in ('intro', 'recall', 'cloze', 'collocation', 'match')),
  interval_before integer not null,
  interval_after integer not null,
  reviewed_at timestamptz not null default now()
);

create index review_logs_user_reviewed_idx on public.review_logs (user_id, reviewed_at desc);

alter table public.user_words enable row level security;
alter table public.review_logs enable row level security;

create policy "user_words: owner can read" on public.user_words for select to authenticated
using ((select auth.uid()) = user_id);
create policy "review_logs: owner can read" on public.review_logs for select to authenticated
using ((select auth.uid()) = user_id);

-- Written only by the functions below.
revoke all on public.user_words, public.review_logs from anon, authenticated;
grant select on public.user_words, public.review_logs to authenticated;

-- ---------------------------------------------------------------------------
-- My words
-- ---------------------------------------------------------------------------
create function public.add_set_to_my_words(target_set_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  added integer;
begin
  if current_user_id is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;
  if not exists (
    select 1 from public.vocabulary_sets vs where vs.id = target_set_id
  ) or not public.is_published_content(target_set_id) then
    raise exception 'set_not_found' using errcode = 'P0001';
  end if;

  insert into public.user_words (user_id, word_id)
  select current_user_id, vsw.word_id
  from public.vocabulary_set_words vsw
  where vsw.set_id = target_set_id
  order by vsw.position
  on conflict (user_id, word_id) do nothing;
  get diagnostics added = row_count;
  return added;
end;
$$;

create function public.add_word_to_my_words(target_word_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  added integer;
begin
  if current_user_id is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;
  if not public.is_published_word(target_word_id) then
    raise exception 'word_not_found' using errcode = 'P0001';
  end if;

  insert into public.user_words (user_id, word_id)
  values (current_user_id, target_word_id)
  on conflict (user_id, word_id) do nothing;
  get diagnostics added = row_count;
  return added = 1;
end;
$$;

-- ---------------------------------------------------------------------------
-- New words: daily limit counted in the learner's local calendar day
-- ---------------------------------------------------------------------------
create function public.new_word_allowance(target_user_id uuid, at timestamptz)
returns integer
language sql
stable
set search_path = ''
as $$
  select greatest(0, p.daily_new_words - (
    select count(*)::int from public.user_words uw
    where uw.user_id = target_user_id
      and uw.introduced_at is not null
      and (uw.introduced_at at time zone p.timezone)::date = (at at time zone p.timezone)::date
  ))
  from public.profiles p
  where p.id = target_user_id;
$$;

create function public.introduce_new_words()
returns setof uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  allowance integer;
begin
  if current_user_id is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;
  -- One introduction at a time per learner, so two tabs cannot exceed the limit.
  perform pg_advisory_xact_lock(hashtextextended('introduce:' || current_user_id::text, 0));

  allowance := coalesce(public.new_word_allowance(current_user_id, now()), 0);
  if allowance = 0 then
    return;
  end if;

  return query
  with picked as (
    select uw.word_id
    from public.user_words uw
    where uw.user_id = current_user_id and uw.status = 'new'
    order by uw.queue_order
    limit allowance
    for update
  )
  update public.user_words uw
  set status = 'learning', introduced_at = now(), due_at = now()
  from picked
  where uw.user_id = current_user_id and uw.word_id = picked.word_id
  returning uw.word_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Review (SM-2 style). Rules: docs/superpowers/plans/2026-11-08-p3-vocabulary-grammar.md
-- ---------------------------------------------------------------------------
create function public.review_word(
  target_word_id uuid,
  grade text,
  exercise text,
  expected_review_count integer
)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  state public.user_words;
  new_ease numeric(4, 2);
  new_interval integer;
  new_repetitions integer;
  new_lapses integer;
  new_due timestamptz;
begin
  if current_user_id is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;
  if grade is null or grade not in ('again', 'hard', 'good', 'easy')
     or exercise is null or exercise not in ('intro', 'recall', 'cloze', 'collocation', 'match') then
    raise exception 'invalid_response' using errcode = 'P0001';
  end if;

  select * into state from public.user_words
  where user_id = current_user_id and word_id = target_word_id
  for update;
  if not found then
    raise exception 'word_not_found' using errcode = 'P0001';
  end if;
  if state.status = 'new' then
    raise exception 'word_not_introduced' using errcode = 'P0001';
  end if;
  if expected_review_count is null or state.review_count <> expected_review_count then
    raise exception 'stale_review' using errcode = 'P0001';
  end if;

  new_ease := state.ease;
  new_repetitions := state.repetitions + 1;
  new_lapses := state.lapses;

  case grade
    when 'again' then
      new_ease := greatest(1.30, state.ease - 0.20);
      new_interval := 0;
      new_repetitions := 0;
      new_lapses := state.lapses + 1;
    when 'hard' then
      new_ease := greatest(1.30, state.ease - 0.15);
      new_interval := greatest(1, round(state.interval_days * 1.2))::int;
    when 'good' then
      new_interval := case state.repetitions
        when 0 then 1
        when 1 then 3
        else round(state.interval_days * state.ease)::int
      end;
    else -- easy
      new_ease := state.ease + 0.15;
      new_interval := case when state.repetitions = 0 then 4
        else round(state.interval_days * state.ease * 1.3)::int end;
  end case;

  new_due := case when grade = 'again' then now() + interval '10 minutes'
                  else now() + make_interval(days => new_interval) end;

  update public.user_words
  set ease = new_ease,
      interval_days = new_interval,
      repetitions = new_repetitions,
      lapses = new_lapses,
      review_count = state.review_count + 1,
      due_at = new_due
  where user_id = current_user_id and word_id = target_word_id;

  insert into public.review_logs (user_id, word_id, grade, exercise, interval_before, interval_after)
  values (current_user_id, target_word_id, grade, exercise, state.interval_days, new_interval);

  return new_due;
end;
$$;

-- One server-written event per finished session, counted from the review log.
create function public.finish_review_session(session_started_at timestamptz)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  reviews integer;
  new_words integer;
  agains integer;
begin
  if current_user_id is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;
  if session_started_at is null or session_started_at > now()
     or session_started_at < now() - interval '6 hours' then
    raise exception 'invalid_response' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from public.activity_events e
    where e.user_id = current_user_id and e.type = 'vocabulary.review_session'
      and (e.metadata ->> 'session_started_at')::timestamptz = session_started_at
  ) then
    return;
  end if;

  select count(*)::int,
         (count(*) filter (where rl.exercise = 'intro'))::int,
         (count(*) filter (where rl.grade = 'again'))::int
  into reviews, new_words, agains
  from public.review_logs rl
  where rl.user_id = current_user_id and rl.reviewed_at >= session_started_at;

  if reviews = 0 then
    return;
  end if;

  insert into public.activity_events (user_id, type, module, duration_seconds, metadata)
  values (
    current_user_id,
    'vocabulary.review_session',
    'vocabulary',
    least(greatest(extract(epoch from now() - session_started_at)::int, 0), 86400),
    jsonb_build_object(
      'reviews', reviews,
      'new_words', new_words,
      'again', agains,
      'session_started_at', session_started_at
    )
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Weekly goal: distinct local days with a review in the current local week (Monday start)
-- ---------------------------------------------------------------------------
create function public.review_days_in_week(target_user_id uuid, at timestamptz)
returns integer
language sql
stable
set search_path = ''
as $$
  select count(distinct (rl.reviewed_at at time zone p.timezone)::date)::int
  from public.review_logs rl
  join public.profiles p on p.id = rl.user_id
  where rl.user_id = target_user_id
    and (rl.reviewed_at at time zone p.timezone) >= date_trunc('week', at at time zone p.timezone)
    and (rl.reviewed_at at time zone p.timezone)
        < date_trunc('week', at at time zone p.timezone) + interval '7 days';
$$;

create function public.weekly_review_days()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select public.review_days_in_week((select auth.uid()), now());
$$;

-- Public API for learners; helpers stay private.
revoke execute on function public.add_set_to_my_words(uuid) from public, anon;
revoke execute on function public.add_word_to_my_words(uuid) from public, anon;
revoke execute on function public.introduce_new_words() from public, anon;
revoke execute on function public.review_word(uuid, text, text, integer) from public, anon;
revoke execute on function public.finish_review_session(timestamptz) from public, anon;
revoke execute on function public.weekly_review_days() from public, anon;
grant execute on function public.add_set_to_my_words(uuid) to authenticated;
grant execute on function public.add_word_to_my_words(uuid) to authenticated;
grant execute on function public.introduce_new_words() to authenticated;
grant execute on function public.review_word(uuid, text, text, integer) to authenticated;
grant execute on function public.finish_review_session(timestamptz) to authenticated;
grant execute on function public.weekly_review_days() to authenticated;

revoke execute on function public.new_word_allowance(uuid, timestamptz) from public, anon, authenticated;
revoke execute on function public.review_days_in_week(uuid, timestamptz) from public, anon, authenticated;
