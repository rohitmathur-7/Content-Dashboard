-- Run this in Supabase SQL Editor. If you already ran the old schema.sql,
-- drop the old tables first: drop table if exists prep_details, activities cascade;

create table if not exists activity_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz default now()
);

create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  activity_type_id uuid references activity_types(id) on delete cascade,
  week text not null,
  date text not null,
  day text not null,
  classes text,
  posting_type text,
  locations text,
  reference_link text,
  sort_order int,
  created_at timestamptz default now()
);

-- One prep_details row per activity TYPE, shared across every dated
-- instance of that activity (e.g. all "Beach Party" dates point here).
create table if not exists prep_details (
  id uuid primary key default gen_random_uuid(),
  activity_type_id uuid references activity_types(id) on delete cascade,
  content_type text,
  reference_links text,
  shoot_locations text,
  kids text,
  shooters text,
  equipment text,
  script text,
  schedule_date text,
  edit_start_date text,
  edit_log text,
  updated_at timestamptz default now(),
  updated_by text
);

create unique index if not exists prep_details_activity_type_id_key on prep_details(activity_type_id);

alter table activity_types enable row level security;
alter table activities enable row level security;
alter table prep_details enable row level security;

create policy "Allow read activity_types" on activity_types for select using (true);
create policy "Allow write activity_types" on activity_types for insert with check (true);

create policy "Allow read activities" on activities for select using (true);
create policy "Allow write activities" on activities for insert with check (true);
create policy "Allow update activities" on activities for update using (true);

create policy "Allow read prep_details" on prep_details for select using (true);
create policy "Allow write prep_details" on prep_details for insert with check (true);
create policy "Allow update prep_details" on prep_details for update using (true);
