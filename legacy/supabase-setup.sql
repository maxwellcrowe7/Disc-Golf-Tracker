-- Supabase setup for the 'Personal Tools' project — run once in the SQL Editor.
-- One table holds per-user, per-app data bundles (disc golf tracker now,
-- other personal tools later via their own `app` value).

create table public.app_state (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  app text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, app)
);

-- Row Level Security: every user can only see and change their own rows.
alter table public.app_state enable row level security;

create policy "Users manage their own data"
  on public.app_state
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- "Automatically expose new tables" is disabled on this project, so access
-- is granted explicitly — to signed-in users only (anonymous gets nothing).
grant select, insert, update, delete on public.app_state to authenticated;
