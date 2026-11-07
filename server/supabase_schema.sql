-- ⚠️ SUPERSEDED — DO NOT RUN. Use server/database/schema.sql instead (complete, up to date, RLS enabled).

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  role TEXT DEFAULT 'athlete',
  membership_type TEXT DEFAULT 'free_athlete',
  account_status TEXT DEFAULT 'active',
  profile_image TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Records Table
CREATE TABLE IF NOT EXISTS records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  athlete_id TEXT,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  value TEXT NOT NULL,
  unit TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  evidence_url TEXT NOT NULL,
  thumbnail_url TEXT,
  venue_name TEXT,
  city TEXT,
  witnesses JSONB DEFAULT '[]',
  video_type TEXT CHECK (video_type IN ('upload', 'youtube')),
  is_featured BOOLEAN DEFAULT FALSE,
  video_url TEXT,
  record_type TEXT DEFAULT 'standard',
  date_set TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Events Table
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT NOT NULL,
  image_url TEXT,
  competitors TEXT,
  judges TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Products Table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  category TEXT,
  stock_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Contact Messages Table
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Videos Table
CREATE TABLE IF NOT EXISTS videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  record_id UUID REFERENCES records(id) ON DELETE CASCADE,
  attempt_id UUID,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_type TEXT NOT NULL CHECK (video_type IN ('record', 'attempt', 'featured', 'newest_record', 'attempt_history')),
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  source TEXT NOT NULL CHECK (source IN ('uploaded', 'youtube', 'external_url')),
  youtube_video_id TEXT,
  duration INTEGER,
  is_published BOOLEAN DEFAULT TRUE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_video_reference CHECK (record_id IS NOT NULL OR attempt_id IS NOT NULL)
);

-- 7. Evidence Table
CREATE TABLE IF NOT EXISTS evidence (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  record_id UUID NOT NULL REFERENCES records(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  evidence_type TEXT NOT NULL CHECK (evidence_type IN ('photo', 'screenshot', 'document', 'certificate')),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  verification_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Create Indexes for Better Query Performance
CREATE INDEX IF NOT EXISTS idx_videos_record_id ON videos(record_id);
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_video_type ON videos(video_type);
CREATE INDEX IF NOT EXISTS idx_videos_source ON videos(source);
CREATE INDEX IF NOT EXISTS idx_videos_is_published ON videos(is_published);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at);

CREATE INDEX IF NOT EXISTS idx_evidence_record_id ON evidence(record_id);
CREATE INDEX IF NOT EXISTS idx_evidence_user_id ON evidence(user_id);
CREATE INDEX IF NOT EXISTS idx_evidence_status ON evidence(status);
CREATE INDEX IF NOT EXISTS idx_evidence_evidence_type ON evidence(evidence_type);
CREATE INDEX IF NOT EXISTS idx_evidence_created_at ON evidence(created_at);

-- ========================================================
-- 9. ADD MISSING COLUMNS TO EXISTING EVENTS TABLE
-- ========================================================
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_live BOOLEAN DEFAULT FALSE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS stream_url TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT FALSE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS ticket_price DECIMAL(10, 2) DEFAULT 0.00;
ALTER TABLE events ADD COLUMN IF NOT EXISTS competitors TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS judges TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

-- ========================================================
-- 10. Categories Table
-- ========================================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  parent UUID REFERENCES categories(id) ON DELETE SET NULL,
  order_num INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  rules TEXT DEFAULT '',
  submission_requirements TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================================
-- 11. Age Groups Table
-- ========================================================
CREATE TABLE IF NOT EXISTS age_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  min_age INTEGER NOT NULL,
  max_age INTEGER,
  description TEXT DEFAULT '',
  active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================================
-- 12. Memberships Table
-- ========================================================
CREATE TABLE IF NOT EXISTS memberships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('free', 'bronze', 'silver', 'gold')),
  start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  end_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  auto_renew BOOLEAN DEFAULT FALSE,
  submission_limit INTEGER DEFAULT 3,
  submission_count INTEGER DEFAULT 0,
  features JSONB DEFAULT '[]',
  price DECIMAL(10, 2) DEFAULT 0.00,
  renewal_price DECIMAL(10, 2) DEFAULT 0.00,
  payment_history JSONB DEFAULT '[]',
  cancellation_date TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================================
-- 13. Tickets Table
-- ========================================================
CREATE TABLE IF NOT EXISTS tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  access_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'used', 'revoked')),
  ticket_type TEXT DEFAULT 'spectator' CHECK (ticket_type IN ('spectator', 'vip', 'free')),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================================
-- 14. Record Meta Table
-- ========================================================
CREATE TABLE IF NOT EXISTS record_meta (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  record_id UUID NOT NULL REFERENCES records(id) ON DELETE CASCADE,
  tracking_number TEXT,
  submission_fee DECIMAL(10, 2) DEFAULT 0.00,
  admin_notes TEXT,
  history JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================================
-- 15. Create New Indexes for Better Query Performance
-- ========================================================
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON memberships(status);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_record_meta_record_id ON record_meta(record_id);

-- ========================================================
-- 16. DISABLE ROW LEVEL SECURITY (RLS) FOR BACKEND ACCESS
-- ========================================================
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE records DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE videos DISABLE ROW LEVEL SECURITY;
ALTER TABLE evidence DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE age_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE record_meta DISABLE ROW LEVEL SECURITY;

-- ========================================================
-- 17. Orders Table
-- ========================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  shipping_address TEXT,
  subtotal DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) DEFAULT 0.00,
  total DECIMAL(10, 2) NOT NULL,
  shipping_status TEXT DEFAULT 'pending' CHECK (shipping_status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================================
-- 18. Order Items Table
-- ========================================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  size TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================================
-- 19. Alter Products for sizes and multiple images
-- ========================================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS sizes JSONB DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_urls JSONB DEFAULT '[]';

-- Disable RLS for new tables
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_shipping_status ON orders(shipping_status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- ========================================================
-- 20. Coupons Table
-- ========================================================
CREATE TABLE IF NOT EXISTS coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  expiration_date TIMESTAMP WITH TIME ZONE,
  applies_to TEXT DEFAULT 'all' CHECK (applies_to IN ('all', 'product', 'category', 'membership', 'ticket')),
  target_id TEXT, -- Can be product UUID, category slug, membership tier name, or ticket event UUID
  min_purchase DECIMAL(10, 2) DEFAULT 0.00,
  max_redemptions INTEGER,
  redemptions_count INTEGER DEFAULT 0,
  restricted_membership_tier TEXT,
  restricted_country TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Alter Orders for coupon metrics tracking
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0.00;

-- Disable RLS for coupons
ALTER TABLE coupons DISABLE ROW LEVEL SECURITY;

-- Index for coupons code lookup
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(active);

-- ========================================================
-- 21. System Settings & Success Messages Table
-- ========================================================
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Success Messages
INSERT INTO system_settings (key, value) VALUES
  ('msg_shop', 'Thank you! Your order has been processed securely. Your items will be processed and shipped shortly.'),
  ('msg_spectator', 'Thank you! Your order has been processed securely. Your spectator passes will be activated shortly.'),
  ('msg_combined', 'Thank you! Your order has been processed securely. Your items will be shipped shortly and your spectator passes will be activated shortly.'),
  ('msg_record', 'Thank you! Your order has been processed securely. Our adjudication team will get back to you with the results using the email you provided.'),
  ('msg_challenge', 'Thank you! Your challenge registration fee has been securely processed. Prepare to compete and claim your record!')
ON CONFLICT (key) DO NOTHING;

-- Disable RLS for system_settings
ALTER TABLE system_settings DISABLE ROW LEVEL SECURITY;

-- ========================================================
-- 22. Ticket Scanning Fields
-- ========================================================
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS scan_count INTEGER DEFAULT 0;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS last_scanned_at TIMESTAMP WITH TIME ZONE;

-- ========================================================
-- 23. Adjudicator Management Fields
-- ========================================================
-- 1. Support administrative feedback comments on judges
ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- 2. Expand records table to support multi-stage judge workflows
ALTER TABLE records ADD COLUMN IF NOT EXISTS assigned_judge_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE records ADD COLUMN IF NOT EXISTS judge_decision TEXT CHECK (judge_decision IN ('verified', 'rejected', 'pending') OR judge_decision IS NULL);
ALTER TABLE records ADD COLUMN IF NOT EXISTS judge_notes TEXT;
ALTER TABLE records ADD COLUMN IF NOT EXISTS judge_assigned_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE records ADD COLUMN IF NOT EXISTS judge_decided_at TIMESTAMP WITH TIME ZONE;

-- 3. Create high-performance lookup indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_records_assigned_judge ON records(assigned_judge_id);
CREATE INDEX IF NOT EXISTS idx_records_judge_decision ON records(judge_decision);

-- ========================================================
-- 24. AI Verification Controls Tables & Settings
-- ========================================================
CREATE TABLE IF NOT EXISTS ai_verification_scans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  record_id UUID REFERENCES records(id) ON DELETE CASCADE,
  confidence_score DECIMAL(5, 2) NOT NULL,
  face_check TEXT CHECK (face_check IN ('passed', 'flagged', 'failed')) DEFAULT 'passed',
  deepfake_check TEXT CHECK (deepfake_check IN ('passed', 'flagged', 'failed')) DEFAULT 'passed',
  video_tamper_check TEXT CHECK (video_tamper_check IN ('passed', 'flagged', 'failed')) DEFAULT 'passed',
  audio_tamper_check TEXT CHECK (audio_tamper_check IN ('passed', 'flagged', 'failed')) DEFAULT 'passed',
  status TEXT CHECK (status IN ('passed', 'suspicious', 'failed')) DEFAULT 'passed',
  override_status TEXT CHECK (override_status IN ('approved', 'rejected', 'none')) DEFAULT 'none',
  override_reason TEXT,
  suspicious_flagged BOOLEAN DEFAULT FALSE,
  scan_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Default AI configurations
INSERT INTO system_settings (key, value) VALUES
  ('ai_min_confidence_threshold', '80.00'),
  ('ai_deepfake_check_enabled', 'true'),
  ('ai_video_tampering_check_enabled', 'true'),
  ('ai_audio_tampering_check_enabled', 'true')
ON CONFLICT (key) DO NOTHING;

-- Disable Row Level Security
ALTER TABLE ai_verification_scans DISABLE ROW LEVEL SECURITY;

-- High-performance lookup indexes
CREATE INDEX IF NOT EXISTS idx_ai_scans_record_id ON ai_verification_scans(record_id);
CREATE INDEX IF NOT EXISTS idx_ai_scans_status ON ai_verification_scans(status);

-- ==========================================
-- PHASE 1 & 2: ADMIN PANEL BUILDOUT SCHEMA
-- ==========================================

-- Messages Table (Internal Messaging System)
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notifications Table (Notification Center)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT CHECK (type IN ('push', 'alert', 'maintenance', 'emergency', 'event')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  audience TEXT CHECK (audience IN ('all', 'competitors', 'judges', 'vips', 'specific_user')),
  target_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Reports Table (Public Reporting & Moderation)
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reported_item_type TEXT CHECK (reported_item_type IN ('user', 'record', 'comment', 'livestream')),
  reported_item_id UUID,
  reason TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'reviewed', 'action_taken', 'dismissed')) DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bans Table (Ban & Suspension System)
CREATE TABLE IF NOT EXISTS bans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  ban_type TEXT CHECK (ban_type IN ('temporary', 'permanent', 'chat_only', 'ip_ban')),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Media Assets Table (Media Library Management)
CREATE TABLE IF NOT EXISTS media_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  uploader_id UUID REFERENCES users(id) ON DELETE SET NULL,
  file_url TEXT NOT NULL,
  asset_type TEXT CHECK (asset_type IN ('photo', 'video', 'graphic', 'banner', 'social', 'certificate')),
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Page Content Table (Content Page Management)
CREATE TABLE IF NOT EXISTS page_content (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  last_edited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- FAQs Table (Frequently Asked Questions)
CREATE TABLE IF NOT EXISTS faqs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Homepage Settings Table
CREATE TABLE IF NOT EXISTS homepage_settings (
  section TEXT PRIMARY KEY,
  config JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Certificates Table (Certificate & Award Management)
CREATE TABLE IF NOT EXISTS certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  record_id UUID REFERENCES records(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  certificate_url TEXT NOT NULL,
  is_framed BOOLEAN DEFAULT FALSE,
  order_status TEXT CHECK (order_status IN ('pending', 'processing', 'shipped', 'delivered')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Disable RLS for new tables (per project pattern)
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE bans DISABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets DISABLE ROW LEVEL SECURITY;
ALTER TABLE page_content DISABLE ROW LEVEL SECURITY;
ALTER TABLE faqs DISABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE certificates DISABLE ROW LEVEL SECURITY;

-- ==========================================
-- PHASE 3 & 4: ADMIN PANEL BUILDOUT SCHEMA
-- ==========================================

-- Audit Logs Table (Audit Logs & History Tracking)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Record Archives (Record Archive System)
CREATE TABLE IF NOT EXISTS record_archives (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  original_record_id UUID,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  category TEXT,
  title TEXT,
  snapshot JSONB NOT NULL,
  archived_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- API Keys (API & Integration Controls)
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_name TEXT NOT NULL UNIQUE,
  key_value TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sponsors (Sponsorship & Advertisement Management)
CREATE TABLE IF NOT EXISTS sponsors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  logo_url TEXT,
  banner_url TEXT,
  placement TEXT CHECK (placement IN ('homepage', 'livestream', 'shop', 'footer', 'homepage_top_banner', 'homepage_sidebar', 'live_event', 'featured', 'footer_sponsor', 'video_overlay')),
  link_url TEXT,
  package_type TEXT DEFAULT 'standard',
  start_date DATE,
  end_date DATE,
  description TEXT,
  notes TEXT,
  views_count INTEGER DEFAULT 0,
  clicks_count INTEGER DEFAULT 0,
  active_status BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions (Subscription & Billing Controls)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_tier TEXT CHECK (plan_tier IN ('free', 'bronze', 'silver', 'gold')),
  status TEXT CHECK (status IN ('active', 'past_due', 'canceled')),
  stripe_subscription_id TEXT,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- VIP Competitors (VIP & Verified Competitor System)
CREATE TABLE IF NOT EXISTS vip_competitors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  is_verified BOOLEAN DEFAULT FALSE,
  vip_status TEXT CHECK (vip_status IN ('none', 'elite', 'legend')),
  granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Disable RLS for new tables
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE record_archives DISABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys DISABLE ROW LEVEL SECURITY;
ALTER TABLE sponsors DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE vip_competitors DISABLE ROW LEVEL SECURITY;

-- ========================================================
-- 25. Homepage Section Controls for Records
-- ========================================================
ALTER TABLE records ADD COLUMN IF NOT EXISTS homepage_section TEXT CHECK (
  homepage_section IN ('featured', 'newly_verified', 'recent_uploads', 'top_ranked') OR homepage_section IS NULL
);
ALTER TABLE records ADD COLUMN IF NOT EXISTS homepage_order INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_records_homepage_section ON records(homepage_section);

-- ========================================================
-- 26. Sponsor Extended Fields for Sponsorship Management
-- ========================================================
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- ========================================================
-- 27. Videos Homepage Flags (Featured / Newly Uploaded)
-- ========================================================
ALTER TABLE videos ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS is_newly_uploaded BOOLEAN DEFAULT FALSE;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS category TEXT;

CREATE INDEX IF NOT EXISTS idx_videos_is_featured ON videos(is_featured);
CREATE INDEX IF NOT EXISTS idx_videos_is_newly_uploaded ON videos(is_newly_uploaded);

-- ========================================================
-- 28. Products Image Upload Path Storage
-- ========================================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_path TEXT;

-- ========================================================
-- 29. Users Home Address Persistent Fields
-- ========================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS street_address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS apartment TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS zip_code TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS member_number TEXT UNIQUE;

-- ========================================================
-- 30. Events Detailed Pages & Countdown Fields
-- ========================================================
ALTER TABLE events ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS ticket_link TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS sponsors TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS rules TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'upcoming';
ALTER TABLE events ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'WORLD RECORD';

-- ========================================================
-- 31. Manual Revenues Table for Financial Oversight Page
-- ========================================================
CREATE TABLE IF NOT EXISTS manual_revenues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  date_received TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  payment_method TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  member_number TEXT,
  customer_email TEXT NOT NULL,
  transaction_id TEXT,
  order_number TEXT,
  notes TEXT,
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ========================================================
-- 32. Appeals Table
-- ========================================================
CREATE TABLE IF NOT EXISTS appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id UUID REFERENCES records(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  appeal_reason TEXT NOT NULL,
  evidence_files JSONB DEFAULT '[]',
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Under Review', 'Awaiting Evidence', 'Approved', 'Denied', 'Closed', 'Escalated')),
  admin_notes TEXT,
  resolution_history JSONB DEFAULT '[]',
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_appeals_record_id ON appeals(record_id);
CREATE INDEX IF NOT EXISTS idx_appeals_user_id ON appeals(user_id);
CREATE INDEX IF NOT EXISTS idx_appeals_status ON appeals(status);

ALTER TABLE appeals DISABLE ROW LEVEL SECURITY;
