-- Run this ONLY if you already ran schema.sql before this change.
-- Fresh setups should just use schema.sql — it already includes everything.
--
-- 1. One patient per email (case-insensitive). Existing duplicates are
--    merged into the oldest row first, so no bookings are lost.
-- 2. Single-use, short-lived login links (patient_login_tokens), separate
--    from the 30-day browser session (patient_sessions).

-- Normalise emails
update patients set email = lower(trim(email)) where email <> lower(trim(email));

-- Merge duplicate patients into the oldest one
create temporary table patient_merge as
select id, first_value(id) over (partition by email order by created_at, id) as keep_id
from patients;

update bookings b set patient_id = m.keep_id
from patient_merge m where b.patient_id = m.id and m.id <> m.keep_id;

update patient_sessions s set patient_id = m.keep_id
from patient_merge m where s.patient_id = m.id and m.id <> m.keep_id;

update patients p set has_account = true
where exists (
  select 1 from patient_merge m join patients d on d.id = m.id
  where m.keep_id = p.id and m.id <> m.keep_id and d.has_account
);

delete from patients p using patient_merge m where p.id = m.id and m.id <> m.keep_id;
drop table patient_merge;

create unique index if not exists patients_email_unique on patients (lower(email));

-- Single-use login links
create table if not exists patient_login_tokens (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz default now()
);
alter table patient_login_tokens enable row level security;
-- No policies on purpose — only ever touched via the service role key.
