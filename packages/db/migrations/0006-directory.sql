-- 0006 — the interpreter's profile and the directory (step H4; interpreter-profile-and-directory.md,
-- data-model.md §3). The language, specialty and service tables came with 0004 (AD-032.1).
BEGIN;

-- Availability (R-DIR-08): weekly rules in Luanda time and blocked days. Indicative only.
CREATE TABLE directory.availability_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interpreter_id uuid NOT NULL REFERENCES identity.interpreter_profiles (account_id) ON DELETE CASCADE,
  weekday integer NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_time > start_time)
);
ALTER TABLE directory.availability_rules ENABLE ROW LEVEL SECURITY;
CREATE INDEX availability_rules_interpreter_idx ON directory.availability_rules (interpreter_id, weekday);

CREATE TABLE directory.availability_exceptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interpreter_id uuid NOT NULL REFERENCES identity.interpreter_profiles (account_id) ON DELETE CASCADE,
  day date NOT NULL,
  note text CHECK (length(note) <= 200),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (interpreter_id, day)
);
ALTER TABLE directory.availability_exceptions ENABLE ROW LEVEL SECURITY;

-- Background: education, experience, certifications ---------------------------------------------
CREATE TABLE directory.education (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interpreter_id uuid NOT NULL REFERENCES identity.interpreter_profiles (account_id) ON DELETE CASCADE,
  institution text NOT NULL CHECK (length(trim(institution)) BETWEEN 2 AND 200),
  degree text NOT NULL CHECK (length(trim(degree)) BETWEEN 2 AND 200),
  field text CHECK (length(field) <= 200),
  start_year integer CHECK (start_year BETWEEN 1950 AND 2100),
  end_year integer CHECK (end_year BETWEEN 1950 AND 2100),
  is_current boolean NOT NULL DEFAULT false,
  certificate_url text CHECK (certificate_url ~ '^https://'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_year IS NULL OR start_year IS NULL OR end_year >= start_year)
);
ALTER TABLE directory.education ENABLE ROW LEVEL SECURITY;
CREATE INDEX education_interpreter_idx ON directory.education (interpreter_id);
CREATE TRIGGER education_set_updated_at BEFORE UPDATE ON directory.education
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

CREATE TABLE directory.experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interpreter_id uuid NOT NULL REFERENCES identity.interpreter_profiles (account_id) ON DELETE CASCADE,
  role text NOT NULL CHECK (length(trim(role)) BETWEEN 2 AND 200),
  organization text NOT NULL CHECK (length(trim(organization)) BETWEEN 2 AND 200),
  start_date date NOT NULL,
  end_date date,
  is_current boolean NOT NULL DEFAULT false,
  description text CHECK (length(description) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date IS NULL OR end_date >= start_date)
);
ALTER TABLE directory.experiences ENABLE ROW LEVEL SECURITY;
CREATE INDEX experiences_interpreter_idx ON directory.experiences (interpreter_id);
CREATE TRIGGER experiences_set_updated_at BEFORE UPDATE ON directory.experiences
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

CREATE TABLE directory.certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interpreter_id uuid NOT NULL REFERENCES identity.interpreter_profiles (account_id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 2 AND 200),
  issuer text NOT NULL CHECK (length(trim(issuer)) BETWEEN 2 AND 200),
  issued_on date,
  expires_on date,
  credential_url text CHECK (credential_url ~ '^https://'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (expires_on IS NULL OR issued_on IS NULL OR expires_on >= issued_on)
);
ALTER TABLE directory.certifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX certifications_interpreter_idx ON directory.certifications (interpreter_id);
CREATE TRIGGER certifications_set_updated_at BEFORE UPDATE ON directory.certifications
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

-- Content (R-DIR-07): published when saved; the team removes it with a reason -------------------
CREATE TABLE directory.media_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interpreter_id uuid NOT NULL REFERENCES identity.interpreter_profiles (account_id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'video' CHECK (kind IN ('video', 'presentation', 'portfolio')),
  title text NOT NULL CHECK (length(trim(title)) BETWEEN 2 AND 200),
  url text NOT NULL CHECK (url ~ '^https://'),
  thumbnail_path text,
  description text CHECK (length(description) <= 2000),
  tags text[] NOT NULL DEFAULT '{}' CHECK (cardinality(tags) <= 10),
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'removed')),
  removed_by uuid REFERENCES identity.profiles (id) ON DELETE SET NULL,
  removed_reason text,
  removed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (status = 'published' OR removed_reason IS NOT NULL)
);
ALTER TABLE directory.media_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX media_items_interpreter_idx ON directory.media_items (interpreter_id, created_at DESC);
CREATE INDEX media_items_removed_by_idx ON directory.media_items (removed_by);
CREATE TRIGGER media_items_set_updated_at BEFORE UPDATE ON directory.media_items
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

CREATE TABLE directory.articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interpreter_id uuid NOT NULL REFERENCES identity.interpreter_profiles (account_id) ON DELETE CASCADE,
  slug util.slug NOT NULL,
  title text NOT NULL CHECK (length(trim(title)) BETWEEN 2 AND 200),
  summary text CHECK (length(summary) <= 500),
  body text NOT NULL CHECK (length(trim(body)) BETWEEN 1 AND 50000),
  cover_path text,
  tags text[] NOT NULL DEFAULT '{}' CHECK (cardinality(tags) <= 10),
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'removed')),
  published_at timestamptz NOT NULL DEFAULT now(),
  removed_by uuid REFERENCES identity.profiles (id) ON DELETE SET NULL,
  removed_reason text,
  removed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (interpreter_id, slug),
  CHECK (status = 'published' OR removed_reason IS NOT NULL)
);
ALTER TABLE directory.articles ENABLE ROW LEVEL SECURITY;
CREATE INDEX articles_published_idx ON directory.articles (published_at DESC);
CREATE INDEX articles_removed_by_idx ON directory.articles (removed_by);
CREATE TRIGGER articles_set_updated_at BEFORE UPDATE ON directory.articles
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

-- Favorites (R-DIR-10): only the requester who marks them sees them -----------------------------
CREATE TABLE directory.favorites (
  requester_account_id uuid NOT NULL REFERENCES identity.profiles (id) ON DELETE CASCADE,
  interpreter_id uuid NOT NULL REFERENCES identity.interpreter_profiles (account_id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (requester_account_id, interpreter_id)
);
ALTER TABLE directory.favorites ENABLE ROW LEVEL SECURITY;
CREATE INDEX favorites_interpreter_idx ON directory.favorites (interpreter_id);

COMMIT;
