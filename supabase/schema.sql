-- Disc Golf Tracker v2 schema. Run once in the Supabase SQL editor.
-- Tables are prefixed dg_ because the Supabase project is shared with other apps.
-- Every table is owner-only via RLS. The old public.app_state row is left untouched
-- as a backup; the app copies it into these tables on first sign-in (see src/lib/migrate.js).

-- ========== shared: keep updated_at current ==========
create or replace function public.dg_touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ========== profile ==========
create table public.dg_profiles (
  user_id      uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  name         text,
  pdga_number  text,
  home_label   text,                 -- e.g. "Lansing, MI" — origin for drive times
  home_lat     double precision,
  home_lng     double precision,
  settings     jsonb not null default '{}',
  legacy_imported_at timestamptz,    -- set once the old app_state data has been copied in
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ========== player rating history ==========
create table public.dg_rating_history (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  effective_date date not null,
  rating         smallint not null check (rating between 400 and 1200),
  source         text not null default 'manual' check (source in ('manual', 'pdga_import', 'legacy')),
  created_at     timestamptz not null default now(),
  unique (user_id, effective_date)
);

-- ========== courses ==========
create table public.dg_courses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  legacy_id   text,                  -- id from the old app, so the import can't create duplicates
  name        text not null check (length(trim(name)) > 0),
  city        text,
  state       text,
  lat         double precision,
  lng         double precision,
  holes       smallint check (holes between 1 and 54),
  terrain     text not null default 'mixed' check (terrain in ('wooded', 'open', 'water', 'hilly', 'mixed')),
  length_ft   integer check (length_ft > 0),
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, legacy_id)
);

-- ========== leagues ==========
create table public.dg_leagues (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  legacy_id      text,
  name           text not null check (length(trim(name)) > 0),
  day_time       text,                -- e.g. "Tue · 6:00 PM"
  home_course_id uuid references public.dg_courses(id) on delete set null,
  color          text,
  notes          text,
  active         boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (user_id, legacy_id)
);

-- ========== events (tournaments, past and planned) ==========
create table public.dg_events (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null default auth.uid() references auth.users(id) on delete cascade,
  legacy_id          text,
  name               text not null check (length(trim(name)) > 0),
  start_date         date not null,
  end_date           date not null,
  city               text,
  lat                double precision,
  lng                double precision,
  pdga               boolean not null default true,
  tier               text,
  division           text,
  format             text not null default 'singles' check (format in ('singles', 'doubles', 'triples', 'team_doubles', 'match_play')),
  status             text not null default 'interested' check (status in ('interested', 'planning', 'registered', 'waitlisted', 'withdrew', 'played', 'recorded')),
  waitlist_pos       smallint,
  reg_opens_on       date,
  remind             boolean not null default false,
  event_url          text,
  entry_fee          numeric(8,2),
  fee_split          smallint not null default 1 check (fee_split between 1 and 4),
  had_caddy          boolean not null default false,
  caddy_fee          numeric(8,2),
  rounds_planned     smallint,
  holes_per_match    smallint,
  team_name          text,
  partners           text[] not null default '{}',
  place              smallint,
  field_size         smallint,
  field_unit         text not null default 'players' check (field_unit in ('players', 'teams')),
  payout             numeric(8,2),
  home_drive_minutes smallint,       -- day trips; overnight trips use dg_lodging
  home_drive_miles   smallint,
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  check (end_date >= start_date),
  check (had_caddy or caddy_fee is null),
  unique (user_id, legacy_id)
);

create table public.dg_event_courses (
  event_id      uuid not null references public.dg_events(id) on delete cascade,
  course_id     uuid not null references public.dg_courses(id) on delete cascade,
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  sort          smallint not null default 0,
  drive_minutes smallint,            -- from lodging if there is one, else from home
  drive_miles   smallint,
  primary key (event_id, course_id)
);

create table public.dg_lodging (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  event_id      uuid not null unique references public.dg_events(id) on delete cascade,
  type          text,                -- Airbnb, Hotel, …
  name          text,
  address       text,
  lat           double precision,
  lng           double precision,
  nights        smallint,
  cost          numeric(8,2),
  split         smallint not null default 1 check (split between 1 and 8),
  drive_minutes smallint,            -- from home
  drive_miles   smallint,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ========== rounds (tournament, league, casual) ==========
create table public.dg_rounds (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  legacy_id    text,
  kind         text not null check (kind in ('tournament', 'league', 'casual')),
  event_id     uuid references public.dg_events(id) on delete cascade,
  league_id    uuid references public.dg_leagues(id) on delete set null,
  course_id    uuid references public.dg_courses(id) on delete set null,
  played_on    date not null,
  round_number smallint,
  par          smallint check (par between 18 and 200),   -- entered with every round; courses don't carry a par
  score        smallint check (score between 18 and 300),
  rating       smallint check (rating between 400 and 1200),
  place        smallint,
  field_size   smallint,
  fee          numeric(8,2),
  payout       numeric(8,2),
  is_team      boolean not null default false,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  check (kind <> 'tournament' or event_id is not null),
  unique (user_id, legacy_id)
);

-- ========== match play ==========
create table public.dg_matches (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  event_id      uuid not null references public.dg_events(id) on delete cascade,
  match_number  smallint not null,
  course_id     uuid references public.dg_courses(id) on delete set null,
  opponent      text,
  opponent_team text,
  holes         text not null default '' check (holes ~ '^[WPL]*$'),  -- one letter per hole: won / push / lost
  hole_count    smallint,           -- 12-hole matches, 9-hole final, …
  -- Overall result. Derived from holes when they're recorded; entered directly when they aren't.
  result        text check (result in ('W', 'P', 'L')),
  notes         text,
  legacy_id     text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (event_id, match_number),
  unique (user_id, legacy_id)
);

-- ========== web push ==========
create table public.dg_push_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  endpoint     text not null unique,
  keys         jsonb not null,
  device_label text,
  created_at   timestamptz not null default now()
);

-- ========== indexes ==========
create index dg_rating_history_user_date on public.dg_rating_history (user_id, effective_date);
create index dg_courses_user on public.dg_courses (user_id, name);
create index dg_events_user_start on public.dg_events (user_id, start_date);
create index dg_rounds_user_played on public.dg_rounds (user_id, played_on);
create index dg_rounds_event on public.dg_rounds (event_id);
create index dg_rounds_course on public.dg_rounds (course_id);
create index dg_rounds_league on public.dg_rounds (league_id);
create index dg_matches_event on public.dg_matches (event_id);

-- ========== updated_at triggers ==========
create trigger dg_profiles_touch before update on public.dg_profiles for each row execute function public.dg_touch_updated_at();
create trigger dg_courses_touch  before update on public.dg_courses  for each row execute function public.dg_touch_updated_at();
create trigger dg_leagues_touch  before update on public.dg_leagues  for each row execute function public.dg_touch_updated_at();
create trigger dg_events_touch   before update on public.dg_events   for each row execute function public.dg_touch_updated_at();
create trigger dg_lodging_touch  before update on public.dg_lodging  for each row execute function public.dg_touch_updated_at();
create trigger dg_rounds_touch   before update on public.dg_rounds   for each row execute function public.dg_touch_updated_at();
create trigger dg_matches_touch  before update on public.dg_matches  for each row execute function public.dg_touch_updated_at();

-- ========== access: signed-in owners only ==========
-- "Automatically expose new tables" is off on this project, so grant explicitly (anonymous gets nothing).
grant select, insert, update, delete on
  public.dg_profiles, public.dg_rating_history, public.dg_courses, public.dg_leagues,
  public.dg_events, public.dg_event_courses, public.dg_lodging, public.dg_rounds,
  public.dg_matches, public.dg_push_subscriptions
  to authenticated;

alter table public.dg_profiles           enable row level security;
alter table public.dg_rating_history     enable row level security;
alter table public.dg_courses            enable row level security;
alter table public.dg_leagues            enable row level security;
alter table public.dg_events             enable row level security;
alter table public.dg_event_courses      enable row level security;
alter table public.dg_lodging            enable row level security;
alter table public.dg_rounds             enable row level security;
alter table public.dg_matches            enable row level security;
alter table public.dg_push_subscriptions enable row level security;

create policy owner_all on public.dg_profiles           for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy owner_all on public.dg_rating_history     for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy owner_all on public.dg_courses            for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy owner_all on public.dg_leagues            for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy owner_all on public.dg_events             for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy owner_all on public.dg_event_courses      for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy owner_all on public.dg_lodging            for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy owner_all on public.dg_rounds             for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy owner_all on public.dg_matches            for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy owner_all on public.dg_push_subscriptions for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
