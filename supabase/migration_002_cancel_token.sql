-- Run this ONLY if you already ran schema.sql before the reschedule/cancel
-- feature was added. Fresh setups should just use schema.sql — skip this file.

alter table bookings add column if not exists cancel_token uuid not null default gen_random_uuid();

-- Replace the old always-on unique constraint with one that ignores
-- cancelled bookings, so cancelling actually frees the slot for reuse.
alter table bookings drop constraint if exists bookings_psychologist_id_scheduled_at_key;
create unique index if not exists bookings_active_slot_unique
  on bookings (psychologist_id, scheduled_at)
  where status != 'cancelled';
