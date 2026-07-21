-- ============================================
-- Silver Link — Database Schema (PostgreSQL)
-- Normalized per Phase 1 MVP scope
--
-- Every statement here is written to be safe to run repeatedly against a
-- database that already has some or all of this schema — CREATE TABLE IF NOT
-- EXISTS, CREATE INDEX IF NOT EXISTS, and DROP-then-CREATE for triggers
-- (Postgres has no CREATE TRIGGER IF NOT EXISTS). This matters because
-- db/migrate.js is designed to run on every deploy, not just once.
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------- Reference tables ----------

CREATE TABLE IF NOT EXISTS universities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(150) NOT NULL UNIQUE,
  state VARCHAR(80),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  state VARCHAR(80) NOT NULL,
  city VARCHAR(80) NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  UNIQUE (state, city)
);

-- ---------- Core identity ----------

-- Single users table for auth; role determines which profile table applies
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'company', 'admin')),
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(150) NOT NULL,
  university_id UUID REFERENCES universities(id),
  faculty VARCHAR(120),
  department VARCHAR(120),
  level VARCHAR(20),
  preferred_location_id UUID REFERENCES locations(id),
  siwes_start_date DATE,
  siwes_end_date DATE,
  skills TEXT[],
  cv_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_students_department ON students(department);
CREATE INDEX IF NOT EXISTS idx_students_university ON students(university_id);

-- ---------- Companies ----------

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL, -- null until claimed
  name VARCHAR(150) NOT NULL,
  logo_url TEXT,
  industry VARCHAR(100),
  description TEXT,
  website VARCHAR(255),
  location_id UUID REFERENCES locations(id),
  address TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'historical_listing'
    CHECK (status IN ('currently_accepting', 'pending_confirmation', 'historical_listing', 'applications_closed')),
  is_verified BOOLEAN DEFAULT FALSE,
  verification_email VARCHAR(160),
  available_slots INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(industry);
CREATE INDEX IF NOT EXISTS idx_companies_location ON companies(location_id);

CREATE TABLE IF NOT EXISTS company_departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  department VARCHAR(120) NOT NULL,
  UNIQUE (company_id, department)
);
CREATE INDEX IF NOT EXISTS idx_company_departments_dept ON company_departments(department);

-- ---------- Interaction tables ----------

CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  status VARCHAR(30) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected')),
  cover_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (student_id, company_id)
);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  training_quality SMALLINT CHECK (training_quality BETWEEN 1 AND 5),
  work_environment SMALLINT CHECK (work_environment BETWEEN 1 AND 5),
  mentorship SMALLINT CHECK (mentorship BETWEEN 1 AND 5),
  allowance_info TEXT,
  overall_rating SMALLINT CHECK (overall_rating BETWEEN 1 AND 5) NOT NULL,
  comment TEXT,
  is_moderated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (student_id, company_id)
);
CREATE INDEX IF NOT EXISTS idx_reviews_company ON reviews(company_id);

CREATE TABLE IF NOT EXISTS saved_companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (student_id, company_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

-- ---------- Trigger: keep updated_at fresh ----------
-- CREATE OR REPLACE works for functions, but Postgres has no equivalent for
-- triggers — DROP IF EXISTS then CREATE is the standard idempotent pattern.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated ON users;
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_students_updated ON students;
CREATE TRIGGER trg_students_updated BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_companies_updated ON companies;
CREATE TRIGGER trg_companies_updated BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_applications_updated ON applications;
CREATE TRIGGER trg_applications_updated BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION set_updated_at();