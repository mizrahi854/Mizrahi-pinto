-- v2: simple weekly training, weekly plan (events / planned meals), Shabbat plan and restaurant mode.
-- Same pattern as the init migration: client-generated text ids, owner-only RLS.

create table public.planned_workouts (
  id text primary key, user_id uuid not null references auth.users(id) on delete cascade,
  workout_date date not null, workout_time time, name text not null, muscles text[] not null default '{}',
  rest boolean not null default false, duration_min int, notes text,
  status text not null default 'planned' check (status in ('planned','done','skipped')), done_at timestamptz,
  updated_at timestamptz not null default now()
);
create index on public.planned_workouts (user_id, workout_date);

create table public.plan_events (
  id text primary key, user_id uuid not null references auth.users(id) on delete cascade,
  event_date date not null, event_time time, type text not null check (type in ('family','restaurant','special')),
  title text not null, note text, meal text, restaurant_type text, restaurant_id text, updated_at timestamptz not null default now()
);

create table public.planned_meals (
  id text primary key, user_id uuid not null references auth.users(id) on delete cascade,
  meal_date date not null, meal text not null, title text not null, items jsonb not null default '[]', note text,
  source text, eaten_at timestamptz, updated_at timestamptz not null default now()
);

create table public.shabbat_plans (
  user_id uuid primary key references auth.users(id) on delete cascade, plan jsonb not null, updated_at timestamptz not null default now()
);

create table public.restaurants (
  id text primary key, user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, type text not null, favorite boolean not null default false
);

create table public.restaurant_dishes (
  id text primary key, user_id uuid not null references auth.users(id) on delete cascade,
  restaurant_id text, name text not null, type text not null,
  kcal numeric, protein numeric, carbs numeric, fat numeric,
  estimated boolean not null default true, basis text, ingredients text,
  allergens text[], -- null = unknown, never invented
  favorite boolean not null default false, created_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['planned_workouts','plan_events','planned_meals','shabbat_plans','restaurants','restaurant_dishes'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "own rows" on public.%I for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
  end loop;
end $$;
