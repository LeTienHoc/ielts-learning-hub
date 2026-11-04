-- P1 Platform: learner profiles, activity events and self-service account deletion.
-- Requirements: AUTH-01..06, SET-01, SET-05 (docs/product/product-requirements.md).
-- Every table has Row Level Security; learners can only see and change their own rows.

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user, created by trigger on sign-up
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) between 1 and 60),
  explanation_language text not null default 'en' check (explanation_language in ('en', 'vi')),
  timezone text not null default 'Asia/Ho_Chi_Minh' check (char_length(timezone) <= 64),
  onboarding_status text not null default 'not_started'
    check (onboarding_status in ('not_started', 'in_progress', 'completed', 'skipped')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Learner profile and preferences (1:1 with auth.users).';

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "profiles: owner can read"
on public.profiles for select
to authenticated
using ((select auth.uid()) = id);

create policy "profiles: owner can update"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- No insert/delete policies: rows are created by the trigger below and removed by the
-- cascade from auth.users. Column-level grants stop clients changing id/timestamps.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, explanation_language, timezone, onboarding_status)
  on public.profiles to authenticated;

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    nullif(left(btrim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), 60), '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- activity_events: append-only learning activity log (feeds Progress & Roadmap)
-- ---------------------------------------------------------------------------
create table public.activity_events (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type text not null check (type ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$' and char_length(type) <= 64),
  module text not null check (
    module in (
      'auth', 'onboarding', 'roadmap', 'dashboard', 'vocabulary', 'grammar', 'reading',
      'listening', 'writing', 'speaking', 'ai_tutor', 'progress', 'settings'
    )
  ),
  ref_type text check (ref_type is null or char_length(ref_type) <= 64),
  ref_id text check (ref_id is null or char_length(ref_id) <= 128),
  duration_seconds integer check (duration_seconds is null or duration_seconds between 0 and 86400),
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object' and pg_column_size(metadata) <= 4096),
  occurred_at timestamptz not null default now()
);

comment on table public.activity_events is
  'Append-only learning activity events. Modules emit events; Progress and Roadmap read them.';

create index activity_events_user_occurred_idx
on public.activity_events (user_id, occurred_at desc);

alter table public.activity_events enable row level security;

create policy "activity_events: owner can read"
on public.activity_events for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "activity_events: owner can append"
on public.activity_events for insert
to authenticated
with check ((select auth.uid()) = user_id);

-- Append-only: no update/delete policies or grants.
revoke all on public.activity_events from anon, authenticated;
grant select, insert on public.activity_events to authenticated;

-- ---------------------------------------------------------------------------
-- Self-service account deletion (AUTH-06). Deletes the caller's auth user; profiles and
-- events are removed by ON DELETE CASCADE. Avoids exposing a service-role key to the app.
-- ---------------------------------------------------------------------------
create function public.delete_current_user()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;
  delete from auth.users where id = current_user_id;
end;
$$;

revoke execute on function public.delete_current_user() from public, anon;
grant execute on function public.delete_current_user() to authenticated;

-- Trigger/helper functions are not part of the public API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
