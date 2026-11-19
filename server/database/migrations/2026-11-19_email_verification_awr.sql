-- AMPEX: email verification after sign-up, and achievement award numbers that start with AWR
-- (Curtis, Nov 19). Safe to run more than once.

-- ---------------------------------------------------------------------------------
-- 1. Email verification. Members who joined before this change count as verified, so nobody
--    already on the site is asked to verify. That backfill happens only when the column is first added.
-- ---------------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'users' and column_name = 'email_verified_at') then
    alter table users add column email_verified_at timestamptz;
    update users set email_verified_at = coalesce(created_at, now());
  end if;
end $$;
-- when the last verification email went out (stops someone from flooding an inbox with resends)
alter table users add column if not exists verification_sent_at timestamptz;

-- ---------------------------------------------------------------------------------
-- 2. Achievement award numbers: AWR (AMPEX World Records) instead of AWD
-- ---------------------------------------------------------------------------------
update member_awards set award_number = 'AWR' || substr(award_number, 4) where award_number like 'AWD-%';
