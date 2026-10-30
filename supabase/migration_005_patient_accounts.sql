-- Run this ONLY if you already ran schema.sql before patient accounts
-- were added. Fresh setups should just use schema.sql.

create table if not exists patient_sessions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);
alter table patient_sessions enable row level security;
