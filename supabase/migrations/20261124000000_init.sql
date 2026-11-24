-- MIZRAHI PINTO – initial schema (PRD §18.3–18.7)
-- Every private table: user_id + RLS so a user can only read/write their own rows.
-- Client ids are text UUIDs generated on device (idempotent offline sync: upsert by id).

create extension if not exists "pgcrypto";

-- ---------- helpers ----------
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ---------- profiles & preferences ----------
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text check (char_length(name) <= 80),
  age smallint check (age between 10 and 100),
  language text not null default 'he' check (language in ('he','en')),
  goals text[] not null default '{}',
  experience text check (experience in ('beginner','intermediate','advanced')),
  equipment text[] not null default '{}',
  training_days smallint[] not null default '{}',
  training_time text,
  food_prefs text[] not null default '{}',
  allergies text[] not null default '{}',
  limitations text check (char_length(limitations) <= 500),
  height_cm numeric(5,1) check (height_cm between 120 and 230),
  weight_kg numeric(5,1) check (weight_kg between 30 and 300),
  sex text check (sex in ('male','female')),
  activity text,
  plan_days smallint check (plan_days in (30,60,90)),
  water_target_ml int default 3000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.nutrition_targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  valid_from date not null,
  mode text not null check (mode in ('calculated','professional','none')),
  kcal int check (kcal between 1000 and 6000),
  protein_g int, carbs_g int, fat_g int,
  created_at timestamptz not null default now(),
  unique (user_id, valid_from)
);

-- ---------- foods (shared catalogue + private) ----------
create table public.food_sources (
  id text primary key, name text not null, license text, url text
);

create table public.foods (
  id text primary key,
  owner_id uuid references auth.users(id) on delete cascade, -- null = public catalogue
  name text not null, name_en text, brand text, barcode text, category text not null,
  basis text not null check (basis in ('g','ml')),
  kcal numeric, protein numeric, carbs numeric, fat numeric, fiber numeric,
  allergens text[] not null default '{}',
  image_path text,
  source_id text references public.food_sources(id),
  verified boolean not null default false,
  verified_at timestamptz,
  status text not null default 'private' check (status in ('private','pending','public','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (coalesce(kcal,0) >= 0 and coalesce(protein,0) >= 0 and coalesce(carbs,0) >= 0 and coalesce(fat,0) >= 0)
);
create index foods_barcode_idx on public.foods (barcode);
create index foods_name_idx on public.foods using gin (to_tsvector('simple', name));

create table public.food_portions (
  id uuid primary key default gen_random_uuid(),
  food_id text not null references public.foods(id) on delete cascade,
  label text not null, amount numeric not null check (amount > 0)
);

create table public.food_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  food_id text references public.foods(id) on delete set null,
  body text not null check (char_length(body) between 3 and 1000),
  status text not null default 'open',
  created_at timestamptz not null default now()
);

-- ---------- diary ----------
create table public.meals (
  id text primary key, user_id uuid not null references auth.users(id) on delete cascade,
  label text not null, sort smallint default 0
);

create table public.food_entries (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  meal text not null,
  food_id text references public.foods(id) on delete set null,
  name text not null,
  amount numeric, unit_label text, grams numeric,
  -- snapshot of values at logging time (catalogue changes never rewrite history)
  kcal numeric, protein numeric, carbs numeric, fat numeric, fiber numeric,
  logged_time text, photo_path text,
  deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index food_entries_user_date_idx on public.food_entries (user_id, entry_date);

create table public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  food_id text not null, created_at timestamptz not null default now(),
  primary key (user_id, food_id)
);

create table public.saved_meals (
  id text primary key, user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, items jsonb not null default '[]', created_at timestamptz not null default now()
);

-- ---------- recipes & plans ----------
create table public.recipes (
  id text primary key, owner_id uuid references auth.users(id) on delete cascade,
  name text not null, minutes int, servings int not null default 1, meal text, tags text[] default '{}',
  steps text[] default '{}', allergens text[] default '{}', is_public boolean not null default false
);
create table public.recipe_items (
  id uuid primary key default gen_random_uuid(),
  recipe_id text not null references public.recipes(id) on delete cascade,
  food_id text not null references public.foods(id), grams numeric not null check (grams > 0)
);
create table public.meal_plans (
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_date date not null, meal text not null, recipe_id text not null,
  primary key (user_id, plan_date, meal)
);
create table public.shopping_items (
  id text primary key, user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, qty text, checked boolean not null default false, recipe_id text
);

-- ---------- training ----------
create table public.exercises (
  id text primary key, name text not null, name_en text, primary_muscles text[], secondary_muscles text[],
  equipment text, difficulty smallint, kind text, instructions text[], mistakes text[], alternatives text[], media_path text
);
create table public.workout_plans (
  id text primary key, owner_id uuid references auth.users(id) on delete cascade,
  name text not null, focus text, location text, level text, premium boolean default false, exercises jsonb not null default '[]'
);
create table public.workout_schedule (
  user_id uuid not null references auth.users(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6), plan_id text not null,
  primary key (user_id, weekday)
);
create table public.workout_sessions (
  id text primary key, user_id uuid not null references auth.users(id) on delete cascade,
  plan_id text, name text, session_date date not null,
  started_at timestamptz not null, ended_at timestamptz, paused_ms bigint default 0,
  status text not null check (status in ('active','paused','done')), notes text,
  updated_at timestamptz not null default now()
);
create table public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references public.workout_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id text not null, set_index smallint not null, reps int, weight_kg numeric, seconds int, done boolean not null default false,
  unique (session_id, exercise_id, set_index)
);

-- ---------- routine ----------
create table public.reminders (
  id text primary key, user_id uuid not null references auth.users(id) on delete cascade,
  type text not null, title text not null, time text not null, days smallint[] not null, enabled boolean not null default true, sound text
);
create table public.measurements (
  user_id uuid not null references auth.users(id) on delete cascade,
  measured_on date not null, weight_kg numeric(5,1) check (weight_kg between 30 and 300),
  primary key (user_id, measured_on)
);
create table public.habit_logs (
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null, water_ml int, sleep_h numeric(3,1),
  primary key (user_id, log_date)
);

-- ---------- challenges (shared with accepted members only) ----------
create table public.challenges (
  id text primary key, owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null, start_date date not null, end_date date not null, tasks jsonb not null default '[]', finished boolean default false,
  created_at timestamptz not null default now()
);
create table public.challenge_members (
  challenge_id text not null references public.challenges(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'invited' check (status in ('invited','accepted','declined')),
  share_progress boolean not null default true,
  primary key (challenge_id, user_id)
);
create table public.challenge_events (
  id uuid primary key default gen_random_uuid(),
  challenge_id text not null references public.challenges(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_date date not null, task_id text, kind text not null default 'task', note text,
  created_at timestamptz not null default now()
);

-- ---------- entitlements (server-side truth; client never grants Premium) ----------
create table public.entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tier text not null default 'basic' check (tier in ('basic','premium')),
  source text, expires_at timestamptz, updated_at timestamptz not null default now()
);

-- ---------- updated_at triggers ----------
create trigger t_profiles before update on public.profiles for each row execute function public.touch_updated_at();
create trigger t_foods before update on public.foods for each row execute function public.touch_updated_at();
create trigger t_entries before update on public.food_entries for each row execute function public.touch_updated_at();
create trigger t_sessions before update on public.workout_sessions for each row execute function public.touch_updated_at();

-- ---------- RLS ----------
do $$
declare t text;
begin
  foreach t in array array['profiles','nutrition_targets','meals','food_entries','favorites','saved_meals','meal_plans','shopping_items',
                           'workout_schedule','workout_sessions','workout_sets','reminders','measurements','habit_logs','food_reports']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "own rows" on public.%I for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
  end loop;
end $$;

alter table public.food_sources enable row level security;
create policy "read sources" on public.food_sources for select to anon, authenticated using (true);

alter table public.foods enable row level security;
create policy "read public or own foods" on public.foods for select to authenticated using (status = 'public' or owner_id = (select auth.uid()));
create policy "insert own private foods" on public.foods for insert to authenticated with check (owner_id = (select auth.uid()) and status in ('private','pending') and verified = false);
create policy "update own private foods" on public.foods for update to authenticated using (owner_id = (select auth.uid()) and status in ('private','pending')) with check (owner_id = (select auth.uid()) and status in ('private','pending') and verified = false);
create policy "delete own private foods" on public.foods for delete to authenticated using (owner_id = (select auth.uid()) and status = 'private');

alter table public.food_portions enable row level security;
create policy "read portions" on public.food_portions for select to authenticated using (exists (select 1 from public.foods f where f.id = food_id and (f.status = 'public' or f.owner_id = (select auth.uid()))));
create policy "write own portions" on public.food_portions for all to authenticated using (exists (select 1 from public.foods f where f.id = food_id and f.owner_id = (select auth.uid()))) with check (exists (select 1 from public.foods f where f.id = food_id and f.owner_id = (select auth.uid())));

alter table public.recipes enable row level security;
create policy "read recipes" on public.recipes for select to authenticated using (is_public or owner_id = (select auth.uid()));
create policy "write own recipes" on public.recipes for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()) and is_public = false);
alter table public.recipe_items enable row level security;
create policy "read recipe items" on public.recipe_items for select to authenticated using (exists (select 1 from public.recipes r where r.id = recipe_id and (r.is_public or r.owner_id = (select auth.uid()))));
create policy "write own recipe items" on public.recipe_items for all to authenticated using (exists (select 1 from public.recipes r where r.id = recipe_id and r.owner_id = (select auth.uid()))) with check (exists (select 1 from public.recipes r where r.id = recipe_id and r.owner_id = (select auth.uid())));

alter table public.exercises enable row level security;
create policy "read exercises" on public.exercises for select to anon, authenticated using (true);

alter table public.workout_plans enable row level security;
create policy "read plans" on public.workout_plans for select to authenticated using (owner_id is null or owner_id = (select auth.uid()));
create policy "write own plans" on public.workout_plans for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

-- challenges: owner full access; accepted members can read
create or replace function public.is_challenge_member(cid text) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.challenge_members m where m.challenge_id = cid and m.user_id = (select auth.uid()) and m.status = 'accepted')
$$;
alter table public.challenges enable row level security;
create policy "owner manages" on public.challenges for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "members read" on public.challenges for select to authenticated using (public.is_challenge_member(id));

alter table public.challenge_members enable row level security;
create policy "owner invites" on public.challenge_members for all to authenticated using (exists (select 1 from public.challenges c where c.id = challenge_id and c.owner_id = (select auth.uid()))) with check (exists (select 1 from public.challenges c where c.id = challenge_id and c.owner_id = (select auth.uid())));
create policy "invitee sees & answers own invite" on public.challenge_members for select to authenticated using (user_id = (select auth.uid()));
create policy "invitee responds" on public.challenge_members for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()) and status in ('accepted','declined'));

alter table public.challenge_events enable row level security;
create policy "own events" on public.challenge_events for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()) and (exists (select 1 from public.challenges c where c.id = challenge_id and c.owner_id = (select auth.uid())) or public.is_challenge_member(challenge_id)));
create policy "members read shared events" on public.challenge_events for select to authenticated using (
  public.is_challenge_member(challenge_id) or exists (select 1 from public.challenges c where c.id = challenge_id and c.owner_id = (select auth.uid()))
);

alter table public.entitlements enable row level security;
create policy "read own entitlement" on public.entitlements for select to authenticated using (user_id = (select auth.uid()));
-- no insert/update policy: only the service role (server) can grant Premium.

-- ---------- storage: private bucket for meal / label photos ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('user-photos', 'user-photos', false, 5242880, array['image/jpeg','image/png','image/heic','image/webp'])
on conflict (id) do nothing;
create policy "own photos read" on storage.objects for select to authenticated using (bucket_id = 'user-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "own photos write" on storage.objects for insert to authenticated with check (bucket_id = 'user-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "own photos delete" on storage.objects for delete to authenticated using (bucket_id = 'user-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- auto-create profile + basic entitlement on sign-up
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (user_id) values (new.id) on conflict do nothing;
  insert into public.entitlements (user_id, tier) values (new.id, 'basic') on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
