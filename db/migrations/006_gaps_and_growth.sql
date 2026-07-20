-- ============================================
-- Silver Link — Gap fixes + growth features
-- Password reset tokens, company profile view tracking
-- ============================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
  ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);

-- Lightweight view log for company profile analytics ("N students viewed you this week").
-- viewer_user_id is nullable so anonymous/logged-out visits still count toward SEO-driven traffic.
CREATE TABLE IF NOT EXISTS company_profile_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  viewer_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  viewed_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_profile_views_company_time ON company_profile_views(company_id, viewed_at);
