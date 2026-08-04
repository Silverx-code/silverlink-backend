ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS source VARCHAR(30) DEFAULT 'admin',
  ADD COLUMN IF NOT EXISTS discovered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_scraped TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_updated_by_scraper TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS scraper_confidence NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS confidence_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS times_seen INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_seen_online TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS source_page TEXT;

CREATE TABLE IF NOT EXISTS scraper_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  status VARCHAR(20) NOT NULL DEFAULT 'completed',
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  companies_found INTEGER DEFAULT 0,
  companies_added INTEGER DEFAULT 0,
  companies_updated INTEGER DEFAULT 0,
  duplicates_removed INTEGER DEFAULT 0,
  errors TEXT,
  log_file VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scraper_runs_created_at ON scraper_runs(created_at DESC);
