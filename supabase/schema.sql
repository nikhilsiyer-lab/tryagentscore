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
  user_id             UUID REFERENCES users(id),
  domain              TEXT NOT NULL,
  composite_score     INTEGER NOT NULL,
  citation_rate       NUMERIC(5,2) NOT NULL,
  track               TEXT NOT NULL CHECK (track IN ('Service / local business', 'Product or shop')),
  payload             JSONB NOT NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW()
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
