-- AMPEX: Achievement Award catalog (Curtis's corrections, Nov 16 2026). Run AFTER 2026-11-14_awards_email_messages.sql.
-- Safe to run more than once.

-- ---------------------------------------------------------------------------------
-- 1. Catalog fields: design, automatic criteria, order
-- ---------------------------------------------------------------------------------
alter table achievement_awards add column if not exists slug text;
create unique index if not exists achievement_awards_slug_key on achievement_awards (slug);

-- design: 'template' = the AMPEX award design, the site writes the title and description
--         'artwork'  = an uploaded finished design (title and text printed on it); the site writes the name and date
--         'classic'  = the earlier drawn frame (kept for awards made before this change)
alter table achievement_awards add column if not exists design text not null default 'template';
alter table achievement_awards drop constraint if exists achievement_awards_design_check;
alter table achievement_awards add constraint achievement_awards_design_check check (design in ('template', 'artwork', 'classic'));

-- criteria: when members get the award automatically ('manual' = only when an admin gives it)
alter table achievement_awards add column if not exists criteria text not null default 'manual';
alter table achievement_awards drop constraint if exists achievement_awards_criteria_check;
alter table achievement_awards add constraint achievement_awards_criteria_check check (criteria in
  ('manual', 'grand_champion', 'elite_master', 'pro_competitor', 'first_place', 'top_10', 'certified', 'ambassador'));
alter table achievement_awards add column if not exists criteria_value integer;   -- e.g. top 10 in at least 3 categories
alter table achievement_awards add column if not exists sort_order integer not null default 100;

-- awards given automatically: at most once per member and award
alter table member_awards add column if not exists auto boolean not null default false;
create unique index if not exists member_awards_auto_once on member_awards (award_id, user_id) where auto;

-- ---------------------------------------------------------------------------------
-- 2. The seven AMPEX achievement awards (published; automatic)
-- ---------------------------------------------------------------------------------
insert into achievement_awards (slug, title, description, icon, design, background_url, criteria, criteria_value, sort_order, status, color, orientation)
values
  ('grand-champion', 'Grand Champion Achievement Award',
   'The highest echelon of athletic excellence in the Ampex Network, awarded to elite athletes exceeding 5,000 verified power points. True legends of the sport.',
   '👑', 'template', null, 'grand_champion', null, 1, 'published', '#FF5500', 'portrait'),
  ('elite-master', 'Elite Master Achievement Award',
   'A seasoned world record holder with exceptional athletic performance and over 2,000 power points. Highly respected in the Ampex community.',
   '⭐', 'template', null, 'elite_master', null, 2, 'published', '#a200ff', 'portrait'),
  ('ampex-ambassador', 'Ampex Ambassador Achievement Award',
   'Reached the top level of the Ampex Rewards program by inviting members and supporting Ampex World Records.',
   '🎖️', 'template', null, 'ambassador', null, 3, 'published', '#FF6A00', 'portrait'),
  ('first-place', 'First Place Achievement Award',
   'For achieving First Place in a verified Ampex World Records event, demonstrating superior skill, performance, and a commitment to excellence that sets a new standard and inspires others to push beyond human limits!',
   '🥇', 'artwork', '/awards/first-place.jpg', 'first_place', 1, 4, 'published', '#FFD700', 'portrait'),
  ('top-10-rank', 'Top 10 Rank Achievement Award',
   'Ranked in the global top ten for three categories, a testament to elite competitive capability. A True Record Holder and an Ampex Community.',
   '🥈', 'artwork', '/awards/top-10-rank.jpg', 'top_10', 3, 5, 'published', '#cbd5e1', 'portrait'),
  ('pro-competitor', 'Pro Competitor Achievement Award',
   'This award recognizes a Pro Competitor for exceptional skill, discipline, and performance in a verified record or official challenge through Ampex World Records.',
   '🏆', 'artwork', '/awards/pro-competitor.jpg', 'pro_competitor', 1, 6, 'published', '#3b82f6', 'portrait'),
  ('ampex-certified', 'Ampex Certified Achievement Award',
   'This award proudly represents an outstanding individual for exceptional dedication, performance, and achievement of a verified record or notable accomplishment.',
   '📜', 'artwork', '/awards/ampex-certified.jpg', 'certified', 1, 7, 'published', '#4ade80', 'portrait')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------------
-- 3. Remove the old "Rogue" name from the admin account shown on records and its profile link
-- ---------------------------------------------------------------------------------
update records set athlete_id = 'ampexadmin' where trim(athlete_id) = 'rogueadmin';
update users set username = 'ampexadmin'
 where username = 'rogueadmin'
   and not exists (select 1 from users u2 where lower(u2.username) = 'ampexadmin');
