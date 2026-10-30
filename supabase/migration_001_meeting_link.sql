-- Run this ONLY if you already ran schema.sql before the meeting-link feature
-- was added. If you're setting up Supabase fresh, just use schema.sql — it
-- already includes this column, skip this file entirely.

alter table psychologists add column if not exists default_meeting_link text;
alter table psychologists enable row level security;

create policy if not exists "admin can manage psychologist profile"
  on psychologists for all to authenticated using (true) with check (true);
