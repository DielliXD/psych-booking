-- Run this ONLY if you already ran schema.sql before the admin-editable
-- pricing feature was added. Fresh setups should just use schema.sql.

alter table psychologists add column if not exists individual_price text;
alter table psychologists add column if not exists couples_price text;
alter table psychologists add column if not exists cancellation_policy text;

drop policy if exists "public can read psychologist profile" on psychologists;
create policy "public can read psychologist profile" on psychologists for select using (true);
