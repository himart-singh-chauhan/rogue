-- AMPEX: Try These Records, more details per challenge (Curtis, Nov 23). Safe to run more than once.
alter table open_records add column if not exists number integer;          -- challenge number (01–40)
alter table open_records add column if not exists section text;            -- "Record Challenges" / "Funny Talent Challenges"
alter table open_records add column if not exists scoring text;            -- most | longest | fastest
alter table open_records add column if not exists time_limit text;         -- e.g. "1 minute"
alter table open_records add column if not exists sort_order integer;      -- the admin's order on the page
alter table open_records drop constraint if exists open_records_scoring_check;
alter table open_records add constraint open_records_scoring_check check (scoring is null or scoring in ('most', 'longest', 'fastest'));
create unique index if not exists open_records_number_key on open_records (number) where number is not null;
