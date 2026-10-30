-- Run this ONLY if you already ran schema.sql before the chat/messaging
-- feature was added. Fresh setups should just use schema.sql.

alter table messages enable row level security;
drop policy if exists "admin can manage messages" on messages;
create policy "admin can manage messages" on messages for all to authenticated using (true) with check (true);
