-- ============================================
-- Silver Link — Apply method for companies
--
-- Seeded/unclaimed listings have no company account watching a Silver Link
-- dashboard, so the in-platform "Apply" button is a dead end for them until
-- someone claims the listing. This lets an admin (when seeding) or a company
-- (after claiming) specify how a student should actually reach them.
-- ============================================

ALTER TABLE companies ADD COLUMN IF NOT EXISTS apply_method VARCHAR(20) NOT NULL DEFAULT 'platform';

ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_apply_method_check;
ALTER TABLE companies ADD CONSTRAINT companies_apply_method_check
  CHECK (apply_method IN ('platform', 'email', 'in_person', 'external_link'));

ALTER TABLE companies ADD COLUMN IF NOT EXISTS apply_email VARCHAR(160);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS apply_instructions TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS apply_url VARCHAR(255);
