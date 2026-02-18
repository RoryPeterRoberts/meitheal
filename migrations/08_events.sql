-- ============================================================
-- MEITHEAL MIGRATION 08 — EVENTS
-- Run in Supabase SQL editor to create the events table.
-- ============================================================

create table if not exists events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  start_time timestamptz not null,
  end_time timestamptz,
  location text,
  created_by uuid references members(id) not null,
  created_at timestamptz default now()
);

alter table events enable row level security;

-- Policies

create policy "Events are viewable by everyone"
  on events for select
  using (true);

create policy "Members can create events"
  on events for insert
  with check (auth.uid() = (select auth_id from members where id = created_by));

create policy "Members can update their own events"
  on events for update
  using (auth.uid() = (select auth_id from members where id = created_by));

create policy "Members can delete their own events"
  on events for delete
  using (auth.uid() = (select auth_id from members where id = created_by));
