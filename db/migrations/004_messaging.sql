-- ============================================
-- Silver Link — Phase 4 additions
-- Real-time messaging + listing type (SIWES / internship / graduate)
-- ============================================

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS listing_type VARCHAR(20) NOT NULL DEFAULT 'siwes';

ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_listing_type_check;
ALTER TABLE companies ADD CONSTRAINT companies_listing_type_check
  CHECK (listing_type IN ('siwes', 'internship', 'graduate'));

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_messages_application ON messages(application_id, created_at);
