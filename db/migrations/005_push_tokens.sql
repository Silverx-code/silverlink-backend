-- ============================================
-- Silver Link — Phase 4 (mobile) additions
-- Push notification device tokens
-- ============================================

CREATE TABLE IF NOT EXISTS device_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL,
  platform VARCHAR(20) NOT NULL DEFAULT 'expo' CHECK (platform IN ('expo', 'ios', 'android')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, token)
);
CREATE INDEX IF NOT EXISTS idx_device_tokens_user ON device_tokens(user_id);
