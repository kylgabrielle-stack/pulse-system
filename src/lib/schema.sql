-- ============================================================
-- PULSE+ System — Supabase Schema
-- Run this entire script once in your Supabase SQL Editor.
-- Project: https://quyfcicpaqhzdnszpwts.supabase.co
-- ============================================================

-- 1. reports — session-level RPFP / AHD / GAD records
create table if not exists reports (
  id               uuid primary key default gen_random_uuid(),
  type             text not null check (type in ('RPFP','AHD','GAD')),
  code             text,
  date_conducted   date,
  session          text,
  conduct_subtype  text,
  municipality     text,
  barangay         text,
  district         text,
  venue            text,
  target           integer,
  actual           integer default 0,
  male             integer default 0,
  female           integer default 0,
  bracket_1        integer,
  bracket_2        integer,
  bracket_3        integer,
  documented_by    text,
  reviewed_by      text,
  approved_by      text,
  date_documented  date,
  report_month     text,
  report_year      text,
  num_speakers     text,
  speakers         jsonb default '[]'::jsonb,
  activities       jsonb default '{}'::jsonb,
  persons_responsible jsonb default '{}'::jsonb,
  remarks          text,
  status           text not null default 'Pending'
                   check (status in ('Pending','For Review','For Approval','Approved')),
  created_by       uuid references auth.users(id),
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- 2. rpfp_form1_rosters — one row per RPFP Form 1 header
create table if not exists rpfp_form1_rosters (
  id                      uuid primary key default gen_random_uuid(),
  parent_report_id        uuid references reports(id),
  class_no                text,
  municipality            text,
  barangay                text,
  date_conduct            date,
  activity_type           text,
  data_collection_method  text,
  data_collection_other   text,
  prepared_by             text,
  reviewed_by             text,
  approved_by             text,
  created_by              uuid references auth.users(id),
  created_at              timestamptz default now()
);

-- 3. rpfp_form1_participants — one row per participant/couple
create table if not exists rpfp_form1_participants (
  id                    uuid primary key default gen_random_uuid(),
  roster_id             uuid references rpfp_form1_rosters(id) on delete cascade,
  row_number            integer,
  name                  text,
  sex                   text check (sex in ('M','F','')),
  civil_status          text,
  birthdate             date,
  address_household_id  text,
  educational_attainment text,
  no_of_children        text,
  method_used           text,
  intention_to_shift    boolean,
  traditional_fp_type   text,
  traditional_fp_status text,
  reason_for_using_fp   text,
  signature_data        text,
  is_partner_row        boolean default false,
  parent_participant_id uuid references rpfp_form1_participants(id),
  created_at            timestamptz default now()
);

-- 4. municipalities — Cavite LGU reference data
create table if not exists municipalities (
  id        serial primary key,
  name      text not null,
  type      text not null check (type in ('City','Municipality')),
  district  text not null,
  barangay  text not null
);

-- 5. users — extends Supabase Auth with display info
create table if not exists users (
  id        uuid primary key references auth.users(id),
  full_name text,
  office    text default 'Office of the Provincial Population Officer, Province of Cavite'
);

-- ── Enable Row Level Security ─────────────────────────────────────────────────

alter table reports                  enable row level security;
alter table rpfp_form1_rosters       enable row level security;
alter table rpfp_form1_participants  enable row level security;
alter table municipalities           enable row level security;
alter table users                    enable row level security;

-- ── RLS Policies — reports ────────────────────────────────────────────────────

create policy "Authenticated users can read all reports"
  on reports for select to authenticated using (true);

create policy "Authenticated users can insert reports"
  on reports for insert to authenticated with check (true);

create policy "Authenticated users can update reports"
  on reports for update to authenticated using (true);

create policy "Authenticated users can delete reports"
  on reports for delete to authenticated using (true);

-- ── RLS Policies — rpfp_form1_rosters ────────────────────────────────────────

create policy "Authenticated users can read all rosters"
  on rpfp_form1_rosters for select to authenticated using (true);

create policy "Authenticated users can insert rosters"
  on rpfp_form1_rosters for insert to authenticated
  with check (auth.uid() = created_by);

create policy "Authenticated users can update own rosters"
  on rpfp_form1_rosters for update to authenticated
  using (auth.uid() = created_by);

create policy "Authenticated users can delete own rosters"
  on rpfp_form1_rosters for delete to authenticated
  using (auth.uid() = created_by);

-- ── RLS Policies — rpfp_form1_participants ────────────────────────────────────

create policy "Authenticated users can read participants"
  on rpfp_form1_participants for select to authenticated using (true);

create policy "Authenticated users can insert participants"
  on rpfp_form1_participants for insert to authenticated with check (true);

create policy "Authenticated users can update participants"
  on rpfp_form1_participants for update to authenticated using (true);

create policy "Authenticated users can delete participants"
  on rpfp_form1_participants for delete to authenticated using (true);

-- ── RLS Policies — municipalities ─────────────────────────────────────────────

create policy "All authenticated users can read municipalities"
  on municipalities for select to authenticated using (true);

-- ── RLS Policies — users ──────────────────────────────────────────────────────

create policy "Users can read own row"
  on users for select to authenticated using (auth.uid() = id);

create policy "Users can insert own row"
  on users for insert to authenticated with check (auth.uid() = id);

create policy "Users can update own row"
  on users for update to authenticated using (auth.uid() = id);

-- ── updated_at trigger for reports ───────────────────────────────────────────

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger reports_updated_at
  before update on reports
  for each row execute function update_updated_at();
