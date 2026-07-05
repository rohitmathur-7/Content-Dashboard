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
  status text not null default 'drafting',
  created_at timestamptz default now()
);

alter table activities add column if not exists status text not null default 'drafting';
alter table activities drop constraint if exists activities_status_check;
alter table activities add constraint activities_status_check
  check (status in ('drafting', 'in_review', 'scheduled', 'published'));

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
create policy "Allow delete activities" on activities for delete using (true);

create policy "Allow read prep_details" on prep_details for select using (true);
create policy "Allow write prep_details" on prep_details for insert with check (true);
create policy "Allow update prep_details" on prep_details for update using (true);

-- ---------- Library assets (uploaded images/videos/templates) ----------

create table if not exists assets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  file_type text not null check (file_type in ('image', 'video', 'template', 'other')),
  storage_path text not null,
  url text not null,
  size_bytes bigint,
  created_at timestamptz default now()
);

alter table assets enable row level security;

create policy "Allow read assets" on assets for select using (true);
create policy "Allow write assets" on assets for insert with check (true);
create policy "Allow delete assets" on assets for delete using (true);

-- Storage bucket for uploaded asset files. Public read so thumbnails/files can be
-- displayed directly via their public URL.
insert into storage.buckets (id, name, public)
values ('assets', 'assets', true)
on conflict (id) do nothing;

create policy "Allow public read of assets bucket" on storage.objects
  for select using (bucket_id = 'assets');

create policy "Allow upload to assets bucket" on storage.objects
  for insert with check (bucket_id = 'assets');

create policy "Allow delete from assets bucket" on storage.objects
  for delete using (bucket_id = 'assets');
