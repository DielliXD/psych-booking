-- Run this ONLY if you already ran schema.sql before the message
-- notification feature was added. Fresh setups should just use schema.sql.

alter table psychologists add column if not exists notification_email text;
