-- ============================================
-- Silver Link — Phase 3 additions
-- University coordinator role + portal support
-- ============================================

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('student', 'company', 'admin', 'coordinator'));

CREATE TABLE IF NOT EXISTS coordinators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  university_id UUID NOT NULL REFERENCES universities(id),
  full_name VARCHAR(150) NOT NULL,
  title VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_coordinators_university ON coordinators(university_id);
