-- Users Table
CREATE TABLE users (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email               TEXT UNIQUE NOT NULL,
  stripe_customer_id  TEXT,
  subscription_status TEXT DEFAULT 'free',
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Scans Table
CREATE TABLE scans (
  id                  SERIAL PRIMARY KEY,
  user_id             UUID REFERENCES users(id) ON DELETE CASCADE,
  anonymous_session_id TEXT,
  is_claimed          BOOLEAN DEFAULT false,
  domain              TEXT NOT NULL,
  composite_score     INTEGER NOT NULL,
  citation_rate       NUMERIC(5,2) NOT NULL,
  track               TEXT NOT NULL CHECK (track IN ('Service / local business', 'Product or shop')),
  payload             JSONB NOT NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics Events Table
CREATE TABLE user_events (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id TEXT,
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Competitor Snapshots Table (Section 9 PRD Requirement)
CREATE TABLE competitor_snapshots (
  id                SERIAL PRIMARY KEY,
  scan_id           INTEGER REFERENCES scans(id) ON DELETE CASCADE,
  competitor_domain TEXT NOT NULL,
  composite_score   NUMERIC(5,2),
  citation_rate     NUMERIC(5,2),
  captured_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for optimized queries
CREATE INDEX idx_scans_domain ON scans(domain);
CREATE INDEX idx_competitor_snapshots_scan_id ON competitor_snapshots(scan_id);

-- Pro Tier additions
CREATE TABLE IF NOT EXISTS subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id     TEXT,
  status          TEXT DEFAULT 'inactive',
  current_period_end TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
