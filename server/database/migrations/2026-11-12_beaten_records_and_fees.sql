-- AMPEX: beaten records (a winning challenge replaces the record it beat) and admin-editable fees.
-- Safe to run more than once. Run after 2026-11-11b_ledger_delete_fix.sql.

-- A challenge remembers which record it challenged
alter table records add column if not exists challenged_record_id uuid references records(id) on delete set null;
-- The record that beat this one (set when the winning challenge is approved)
alter table records add column if not exists beaten_by_record_id uuid references records(id) on delete set null;
alter table records add column if not exists beaten_at timestamptz;
create index if not exists idx_records_challenged on records (challenged_record_id) where challenged_record_id is not null;
create index if not exists idx_records_beaten on records (beaten_at desc) where beaten_by_record_id is not null;

-- Fees charged when a record is submitted or a record is challenged (Admin → System Settings → Fees)
insert into system_settings (key, value) values ('submission_fee', '3.50'), ('challenge_fee', '3.50')
on conflict (key) do nothing;
