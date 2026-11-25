-- Nov 25 (Curtis): video ads before videos play (10 sec / 30 sec / 1 min) and what each sponsor pays.
-- Prices per ad option are kept in system_settings ('ad_pricing'), so no table is needed for them.
-- Safe to run more than once.

-- 1. A new sponsor spot: "Video ad before videos" (plays before record videos, replays and live streams)
alter table sponsors drop constraint if exists sponsors_placement_check;
alter table sponsors add constraint sponsors_placement_check check (placement in (
  'homepage', 'livestream', 'shop', 'footer', 'homepage_top_banner', 'homepage_sidebar', 'live_event', 'featured',
  'footer_sponsor', 'video_overlay', 'records', 'record_page', 'rankings', 'challenges', 'profiles', 'video_preroll'));

-- 2. Video ad length the sponsor bought (10, 30 or 60 seconds); the ad stops at that length
alter table sponsors add column if not exists ad_seconds integer;
alter table sponsors drop constraint if exists sponsors_ad_seconds_check;
alter table sponsors add constraint sponsors_ad_seconds_check check (ad_seconds is null or ad_seconds in (10, 30, 60));

-- 3. What this sponsor pays, and how often
alter table sponsors add column if not exists price numeric(10, 2);
alter table sponsors add column if not exists price_period text;
alter table sponsors drop constraint if exists sponsors_price_period_check;
alter table sponsors add constraint sponsors_price_period_check check (price_period is null or price_period in ('one_time', 'day', 'week', 'month', 'year'));
