-- Run this in the Supabase SQL editor once your project is created.

create table psychologists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  bio text,
  credentials text,
  photo_url text,
  specialties text[],
  default_meeting_link text, -- her recurring Zoom/Meet link, auto-attached to video bookings
  individual_price text, -- e.g. "€35 per session" — free text so any currency/format works
  couples_price text,
  cancellation_policy text,
  notification_email text, -- where she receives "new message" alerts (can differ from her admin login email)
  created_at timestamptz default now()
);

create table availability_rules (
  id uuid primary key default gen_random_uuid(),
  psychologist_id uuid references psychologists(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6), -- 0=Sunday
  start_time time not null,
  end_time time not null,
  session_format text[] not null default '{video,chat,async}'
);

create table availability_exceptions (
  id uuid primary key default gen_random_uuid(),
  psychologist_id uuid references psychologists(id) on delete cascade,
  date date not null,
  reason text
);

create table patients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  has_account boolean default false,
  created_at timestamptz default now()
);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id) on delete cascade,
  psychologist_id uuid references psychologists(id) on delete cascade,
  session_type text not null check (session_type in ('individual','couples')),
  format text not null check (format in ('video','chat','async')),
  scheduled_at timestamptz not null,
  duration_minutes int not null default 50,
  status text not null default 'confirmed' check (status in ('pending','confirmed','completed','cancelled')),
  meeting_link text,
  price numeric,
  note text,
  cancel_token uuid not null default gen_random_uuid(), -- private link for self-service cancel
  locale text not null default 'sq', -- which language the patient booked in, for reminder/cancel emails
  reminder_sent_at timestamptz, -- prevents sending the 24h reminder twice
  created_at timestamptz default now()
);

-- Partial unique index: only ACTIVE bookings block a slot. A cancelled
-- booking must free up the slot for someone else — a plain table-level
-- unique() would incorrectly keep blocking it forever after cancellation.
create unique index bookings_active_slot_unique
  on bookings (psychologist_id, scheduled_at)
  where status != 'cancelled';

create table messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete cascade,
  sender text not null check (sender in ('patient','psychologist')),
  content text not null,
  sent_at timestamptz default now()
);

create table session_notes (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete cascade,
  notes text, -- consider pgsodium/pgcrypto for encryption at rest
  created_at timestamptz default now()
);

-- Patient dashboard login. Deliberately NOT using Supabase Auth's own user
-- pool — that's reserved for the admin (with public signups disabled).
-- This is a simple, separate magic-link session, same pattern as
-- bookings.cancel_token: a long random id emailed as a link, checked
-- server-side, never exposed to RLS/public policies at all.
create table patient_sessions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);
alter table patient_sessions enable row level security;
-- No policies at all on purpose — only ever touched via the service role key.

-- Row Level Security.
-- Booking creation happens server-side via the service role key (which
-- bypasses RLS entirely), so `bookings` and `patients` need NO public
-- policies at all — they're fully locked down except for the authenticated
-- admin. Availability tables need public SELECT so the booking page can
-- show open slots, but only the authenticated admin can edit them.

alter table bookings enable row level security;
alter table patients enable row level security;
alter table session_notes enable row level security;
alter table availability_rules enable row level security;
alter table availability_exceptions enable row level security;
alter table psychologists enable row level security;

-- Admin (any authenticated user — there's only one, the psychologist)
-- can read everything. Tighten further with a specific email/role check
-- if you ever add more than one authenticated user.
create policy "admin can read bookings" on bookings for select to authenticated using (true);
create policy "admin can read patients" on patients for select to authenticated using (true);
create policy "admin can manage session notes" on session_notes for all to authenticated using (true) with check (true);
create policy "admin can manage messages" on messages for all to authenticated using (true) with check (true);
alter table messages enable row level security;
-- No public policy on messages — patient access goes through server API
-- routes using the service role key (verified via their booking's
-- cancel_token), never direct client-side reads with the anon key.

-- Availability: public can read (needed for the booking calendar),
-- only the authenticated admin can write.
create policy "public can read availability rules" on availability_rules for select using (true);
create policy "admin can manage availability rules" on availability_rules for all to authenticated using (true) with check (true);

create policy "public can read availability exceptions" on availability_exceptions for select using (true);
create policy "admin can manage availability exceptions" on availability_exceptions for all to authenticated using (true) with check (true);

-- Admin can view and edit her own profile (name, bio, pricing, meeting link).
create policy "admin can manage psychologist profile" on psychologists for all to authenticated using (true) with check (true);
-- Public can read her profile — needed so Services/About pages can display
-- her real bio, pricing, and cancellation policy instead of static text.
create policy "public can read psychologist profile" on psychologists for select using (true);
