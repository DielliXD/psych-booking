-- Run this ONLY if you already ran schema.sql before the reminder-email
-- feature was added. Fresh setups should just use schema.sql — skip this file.

alter table bookings add column if not exists locale text not null default 'sq';
alter table bookings add column if not exists reminder_sent_at timestamptz;
