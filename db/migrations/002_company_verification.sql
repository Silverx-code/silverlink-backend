-- ============================================
-- Silver Link — Phase 2 additions
-- Company email verification tokens
-- ============================================

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255),
  ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_companies_verification_token ON companies(verification_token);
