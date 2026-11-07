-- ⚠️ SUPERSEDED — DO NOT RUN. Use server/database/schema.sql instead (complete, up to date, RLS enabled).

-- Create user_rankings table
CREATE TABLE IF NOT EXISTS user_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  global_rank INT DEFAULT NULL,
  country_rank INT DEFAULT NULL,
  state_rank INT DEFAULT NULL,
  city_rank INT DEFAULT NULL,
  category_id UUID REFERENCES categories(id),
  category_rank INT DEFAULT NULL,
  total_points INT DEFAULT 0,
  verified_records_count INT DEFAULT 0,
  world_records_count INT DEFAULT 0,
  top_10_placements INT DEFAULT 0,
  first_place_categories INT DEFAULT 0,
  featured_records_count INT DEFAULT 0,
  live_event_wins INT DEFAULT 0,
  challenge_participations INT DEFAULT 0,
  appeal_wins INT DEFAULT 0,
  medals_earned INT DEFAULT 0,
  certificates_earned INT DEFAULT 0,
  tier_badge VARCHAR(50) DEFAULT 'Challenger', -- Challenger, Pro Competitor, Elite Master, Grand Champion
  last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_points_history table (tracks all point changes)
CREATE TABLE IF NOT EXISTS user_points_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points_earned INT NOT NULL DEFAULT 0,
  point_source VARCHAR(100) NOT NULL, -- 'verified_record', 'world_record', 'top_10', 'first_place', 'featured', 'event_win', 'challenge_participation', 'appeal_win', 'medal', 'certificate', 'admin_adjustment'
  reference_id UUID, -- record_id, event_id, medal_id, certificate_id, etc.
  reference_type VARCHAR(50), -- 'record', 'event', 'medal', 'certificate', 'admin'
  reason TEXT,
  admin_notes TEXT,
  adjusted_by_user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create ranking_history table (tracks ranking changes over time)
CREATE TABLE IF NOT EXISTS ranking_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rank_type VARCHAR(50) NOT NULL, -- 'global', 'country', 'state', 'city', 'category'
  rank_value INT,
  previous_rank INT,
  points_at_time INT,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create points_rules table (defines point system)
CREATE TABLE IF NOT EXISTS points_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name VARCHAR(100) NOT NULL UNIQUE,
  points_value INT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_rankings_user_id ON user_rankings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_rankings_global_rank ON user_rankings(global_rank);
CREATE INDEX IF NOT EXISTS idx_user_rankings_total_points ON user_rankings(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_user_rankings_category ON user_rankings(category_id, category_rank);
CREATE INDEX IF NOT EXISTS idx_points_history_user_id ON user_points_history(user_id);
CREATE INDEX IF NOT EXISTS idx_points_history_source ON user_points_history(point_source);
CREATE INDEX IF NOT EXISTS idx_ranking_history_user_id ON ranking_history(user_id);

-- Insert default points rules
INSERT INTO points_rules (rule_name, points_value, description) VALUES
  ('verified_record', 100, 'Verified Record Approved'),
  ('world_record', 250, 'New World Record Holder'),
  ('top_10_placement', 150, 'Top 10 Leaderboard Placement'),
  ('first_place_category', 300, 'First Place in Category'),
  ('featured_record', 200, 'Featured Record'),
  ('live_event_winner', 500, 'Live Event Winner'),
  ('challenge_participation', 25, 'Challenge Participation'),
  ('appeal_win', 100, 'Appeal Win / Record Reinstated'),
  ('medal_earned', 150, 'Medal Earned'),
  ('certificate_earned', 75, 'Certificate Earned')
ON CONFLICT (rule_name) DO NOTHING;
