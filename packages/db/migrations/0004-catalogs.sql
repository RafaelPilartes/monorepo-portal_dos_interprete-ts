-- 0004 — catalogs (step H3; catalogs.md, data-model.md §2) and the three directory tables that use
-- them, pulled forward from H4 so "used" exists (R-CAT-01, R-CAT-02); H4 adds their policies.
BEGIN;

CREATE TABLE catalog.languages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL CHECK (code ~ '^[a-z]{2,8}$'),
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 2 AND 80),
  is_sign_language boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  sort integer NOT NULL DEFAULT 0 CHECK (sort BETWEEN 0 AND 10000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT languages_code_key UNIQUE (code)
);
ALTER TABLE catalog.languages ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER languages_set_updated_at BEFORE UPDATE ON catalog.languages
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

CREATE TABLE catalog.specialties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug util.slug NOT NULL,
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 2 AND 80),
  description text NOT NULL DEFAULT '' CHECK (length(description) <= 1000),
  active boolean NOT NULL DEFAULT true,
  sort integer NOT NULL DEFAULT 0 CHECK (sort BETWEEN 0 AND 10000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT specialties_slug_key UNIQUE (slug)
);
ALTER TABLE catalog.specialties ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER specialties_set_updated_at BEFORE UPDATE ON catalog.specialties
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

-- platform_price_aoa: the table price of the managed request (D-18).
CREATE TABLE catalog.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug util.slug NOT NULL,
  title text NOT NULL CHECK (length(trim(title)) BETWEEN 2 AND 120),
  description text NOT NULL DEFAULT '' CHECK (length(description) <= 2000),
  pricing_mode text NOT NULL CHECK (pricing_mode IN ('hourly', 'fixed')),
  platform_price_aoa bigint NOT NULL CHECK (platform_price_aoa >= 0),
  icon text CHECK (icon ~ '^[a-z][a-z0-9-]{1,40}$'),
  active boolean NOT NULL DEFAULT true,
  sort integer NOT NULL DEFAULT 0 CHECK (sort BETWEEN 0 AND 10000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT services_slug_key UNIQUE (slug)
);
ALTER TABLE catalog.services ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER services_set_updated_at BEFORE UPDATE ON catalog.services
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

-- directory tables (data-model.md §3), owned by the interpreter (H4 opens their writes) ----------
CREATE TABLE directory.interpreter_languages (
  interpreter_id uuid NOT NULL REFERENCES identity.interpreter_profiles (account_id) ON DELETE CASCADE,
  language_id uuid NOT NULL REFERENCES catalog.languages (id),
  level text NOT NULL CHECK (level IN ('native', 'fluent', 'professional')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (interpreter_id, language_id)
);
ALTER TABLE directory.interpreter_languages ENABLE ROW LEVEL SECURITY;
CREATE INDEX interpreter_languages_language_idx ON directory.interpreter_languages (language_id);

CREATE TABLE directory.interpreter_specialties (
  interpreter_id uuid NOT NULL REFERENCES identity.interpreter_profiles (account_id) ON DELETE CASCADE,
  specialty_id uuid NOT NULL REFERENCES catalog.specialties (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (interpreter_id, specialty_id)
);
ALTER TABLE directory.interpreter_specialties ENABLE ROW LEVEL SECURITY;
CREATE INDEX interpreter_specialties_specialty_idx ON directory.interpreter_specialties (specialty_id);

CREATE TABLE directory.interpreter_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interpreter_id uuid NOT NULL REFERENCES identity.interpreter_profiles (account_id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES catalog.services (id),
  price_aoa bigint NOT NULL CHECK (price_aoa > 0),
  description text CHECK (length(description) <= 1000),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (interpreter_id, service_id)
);
ALTER TABLE directory.interpreter_services ENABLE ROW LEVEL SECURITY;
CREATE INDEX interpreter_services_service_idx ON directory.interpreter_services (service_id);
CREATE TRIGGER interpreter_services_set_updated_at BEFORE UPDATE ON directory.interpreter_services
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

-- R-CAT-01 and R-CAT-02. The guards call catalog.usage_count (functions phase), where each step
-- that references a catalog adds its table; the trigger bodies stay as they are.
CREATE FUNCTION catalog.guard_delete() RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = ''
AS $$
BEGIN
  IF catalog.usage_count(TG_ARGV[0], OLD.id) > 0 THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'IN_USE',
      DETAIL = format('%s %s is used and cannot be deleted', TG_ARGV[0], OLD.id);
  END IF;
  RETURN OLD;
END;
$$;
CREATE TRIGGER languages_guard_delete BEFORE DELETE ON catalog.languages
  FOR EACH ROW EXECUTE FUNCTION catalog.guard_delete('language');
CREATE TRIGGER specialties_guard_delete BEFORE DELETE ON catalog.specialties
  FOR EACH ROW EXECUTE FUNCTION catalog.guard_delete('specialty');
CREATE TRIGGER services_guard_delete BEFORE DELETE ON catalog.services
  FOR EACH ROW EXECUTE FUNCTION catalog.guard_delete('service');

CREATE FUNCTION catalog.guard_service_pricing_mode() RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = ''
AS $$
BEGIN
  IF NEW.pricing_mode IS DISTINCT FROM OLD.pricing_mode AND catalog.usage_count('service', OLD.id) > 0 THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'VALIDATION_FAILED', HINT = 'pricing_mode:locked',
      DETAIL = format('service %s is used: its pricing mode cannot change', OLD.id);
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER services_guard_pricing_mode BEFORE UPDATE ON catalog.services
  FOR EACH ROW EXECUTE FUNCTION catalog.guard_service_pricing_mode();

COMMIT;
