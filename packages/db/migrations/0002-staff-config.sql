-- 0002 — staff, versioned configuration, legal documents, verification document types (step H1;
-- staff-and-config.md, data-model.md §1 and §4). identity.profiles comes forward from H2 because the
-- staff table points at it (MASTER-PLAN, "O que quebra a sequência" 1); H2 adds the rest of identity.
BEGIN;

-- identity.profiles: one row per auth.users account, created by the trigger below (R-ACC-01) -------
CREATE TABLE identity.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name text NOT NULL CHECK (length(trim(full_name)) BETWEEN 2 AND 120),
  phone util.phone_e164,
  avatar_path text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'anonymized')),
  suspended_at timestamptz,
  suspended_reason text,
  anonymized_at timestamptz,
  last_active_role text CHECK (last_active_role IN ('requester', 'interpreter')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((status = 'suspended') = (suspended_at IS NOT NULL)),
  CHECK ((status = 'anonymized') = (anonymized_at IS NOT NULL))
);
ALTER TABLE identity.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON identity.profiles
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

-- Only the profile, never a role (R-ACC-01). The name comes from the sign-up metadata; an account
-- created without one (by the team or a script) starts with the part of the email before the @.
CREATE FUNCTION identity.handle_new_auth_user() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_name text := trim(coalesce(NEW.raw_user_meta_data ->> 'full_name', ''));
BEGIN
  IF length(v_name) < 2 THEN
    v_name := split_part(coalesce(NEW.email, ''), '@', 1);
  END IF;
  IF length(v_name) < 2 THEN
    v_name := coalesce(NEW.email, NEW.id::text);
  END IF;
  INSERT INTO identity.profiles (id, full_name) VALUES (NEW.id, left(v_name, 120))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION identity.handle_new_auth_user() FROM PUBLIC;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION identity.handle_new_auth_user();

-- identity.staff_members (D-60, R-STF-01) ----------------------------------------------------------
CREATE TABLE identity.staff_members (
  account_id uuid PRIMARY KEY REFERENCES identity.profiles (id) ON DELETE CASCADE,
  level text NOT NULL CHECK (level IN ('super_admin', 'moderator', 'finance', 'request_operator')),
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES identity.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE identity.staff_members ENABLE ROW LEVEL SECURITY;
CREATE INDEX staff_members_created_by_idx ON identity.staff_members (created_by);
CREATE INDEX staff_members_active_super_idx ON identity.staff_members (account_id)
  WHERE active AND level = 'super_admin';
CREATE TRIGGER staff_members_set_updated_at BEFORE UPDATE ON identity.staff_members
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

-- identity.legal_documents (D-55, PC-05): a published version is never edited -------------------
CREATE TABLE identity.legal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('terms', 'privacy')),
  version integer NOT NULL CHECK (version > 0),
  body text NOT NULL DEFAULT '',
  published_at timestamptz,
  published_by uuid REFERENCES identity.profiles (id) ON DELETE SET NULL,
  created_by uuid REFERENCES identity.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kind, version)
);
ALTER TABLE identity.legal_documents ENABLE ROW LEVEL SECURITY;
CREATE INDEX legal_documents_published_by_idx ON identity.legal_documents (published_by);
CREATE INDEX legal_documents_created_by_idx ON identity.legal_documents (created_by);
CREATE TRIGGER legal_documents_set_updated_at BEFORE UPDATE ON identity.legal_documents
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

-- Refuses any change to, or removal of, a legal document once published (R-CFG-02 spirit, D-55).
CREATE FUNCTION identity.guard_legal_documents() RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = ''
AS $$
BEGIN
  IF OLD.published_at IS NOT NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'STATE_CHANGED',
      DETAIL = format('legal document %s is published and cannot change', OLD.id);
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;
CREATE TRIGGER legal_documents_guard BEFORE UPDATE OR DELETE ON identity.legal_documents
  FOR EACH ROW EXECUTE FUNCTION identity.guard_legal_documents();

-- config.platform_versions (D-63, R-CFG-01..04): every value nullable, so production can hold
-- "not yet decided" (PC-02, PC-03, PC-06); config.require refuses an empty one -------------------
CREATE TABLE config.platform_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_number integer NOT NULL UNIQUE CHECK (version_number > 0),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'retired')),
  published_at timestamptz,
  published_by uuid REFERENCES identity.profiles (id) ON DELETE SET NULL,
  notes text,
  created_by uuid REFERENCES identity.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  request_min_lead_minutes integer CHECK (request_min_lead_minutes >= 0),
  urgent_threshold_hours integer CHECK (urgent_threshold_hours >= 0),
  max_interpreters_per_request integer CHECK (max_interpreters_per_request >= 0),
  two_interpreters_suggest_minutes integer CHECK (two_interpreters_suggest_minutes >= 0),
  billing_minimum_minutes integer CHECK (billing_minimum_minutes >= 0),
  billing_round_minutes integer CHECK (billing_round_minutes >= 0),
  invite_expiry_hours integer CHECK (invite_expiry_hours >= 0),
  staffing_warning_hours integer CHECK (staffing_warning_hours >= 0),
  overlap_buffer_minutes integer CHECK (overlap_buffer_minutes >= 0),
  cancellation_free_until_hours integer CHECK (cancellation_free_until_hours >= 0),
  completion_auto_confirm_hours integer CHECK (completion_auto_confirm_hours >= 0),
  review_window_days integer CHECK (review_window_days >= 0),
  review_reveal_days integer CHECK (review_reveal_days >= 0),
  chat_close_days integer CHECK (chat_close_days >= 0),
  managed_interpreter_share_pct numeric(5, 2) CHECK (managed_interpreter_share_pct BETWEEN 0 AND 100),
  managed_payment_deadline_hours integer CHECK (managed_payment_deadline_hours >= 0),
  managed_refund_full_until_hours integer CHECK (managed_refund_full_until_hours >= 0),
  managed_refund_late_pct numeric(5, 2) CHECK (managed_refund_late_pct BETWEEN 0 AND 100),
  verification_fee_aoa bigint CHECK (verification_fee_aoa >= 0),
  verification_validity_months integer CHECK (verification_validity_months >= 0),
  verification_renewal_notice_days integer CHECK (verification_renewal_notice_days >= 0),
  verification_refund_on_reject_pct numeric(5, 2) CHECK (verification_refund_on_reject_pct BETWEEN 0 AND 100),
  verification_free_resubmissions integer CHECK (verification_free_resubmissions >= 0),
  verification_payment_deadline_days integer CHECK (verification_payment_deadline_days >= 0),
  event_payment_deadline_hours integer CHECK (event_payment_deadline_hours >= 0),
  event_refund_until_hours integer CHECK (event_refund_until_hours >= 0),
  content_reports_autohide_threshold integer CHECK (content_reports_autohide_threshold >= 0),
  tax_rate_pct numeric(5, 2) CHECK (tax_rate_pct BETWEEN 0 AND 100),
  prices_include_tax boolean,
  academia_bank_name text,
  academia_iban util.iban_ao,
  academia_beneficiary text,
  org_invite_expiry_days integer CHECK (org_invite_expiry_days >= 0),
  support_autoclose_days integer CHECK (support_autoclose_days >= 0),
  mentorship_max_per_mentor integer CHECK (mentorship_max_per_mentor >= 0),
  CHECK ((status = 'draft') = (published_at IS NULL))
);
ALTER TABLE config.platform_versions ENABLE ROW LEVEL SECURITY;
-- Exactly one version in force (R-CFG-01).
CREATE UNIQUE INDEX platform_versions_one_published ON config.platform_versions (status) WHERE status = 'published';
CREATE INDEX platform_versions_published_by_idx ON config.platform_versions (published_by);
CREATE INDEX platform_versions_created_by_idx ON config.platform_versions (created_by);
CREATE TRIGGER platform_versions_set_updated_at BEFORE UPDATE ON config.platform_versions
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

-- R-CFG-02: only drafts change. A published version may only become retired (nothing else
-- changes with it); a retired one never changes; neither is deleted.
CREATE FUNCTION config.guard_platform_versions() RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = ''
AS $$
BEGIN
  IF OLD.status = 'draft' THEN
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'published' AND NEW.status = 'retired'
     AND (to_jsonb(NEW) - 'status' - 'updated_at') = (to_jsonb(OLD) - 'status' - 'updated_at') THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'STATE_CHANGED',
    DETAIL = format('configuration version %s is %s and cannot change', OLD.version_number, OLD.status);
END;
$$;
CREATE TRIGGER platform_versions_guard BEFORE UPDATE OR DELETE ON config.platform_versions
  FOR EACH ROW EXECUTE FUNCTION config.guard_platform_versions();

-- config.verification_document_types (PC-07, R-VER-02) -------------------------------------------
CREATE TABLE config.verification_document_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE CHECK (code ~ '^[a-z][a-z0-9_]{1,40}$'),
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 2 AND 120),
  description text NOT NULL DEFAULT '',
  required boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  sort integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE config.verification_document_types ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER verification_document_types_set_updated_at BEFORE UPDATE ON config.verification_document_types
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

-- Accounts that existed before this migration get their profile too.
INSERT INTO identity.profiles (id, full_name)
SELECT u.id, CASE WHEN length(split_part(coalesce(u.email, ''), '@', 1)) >= 2
                  THEN left(split_part(u.email, '@', 1), 120) ELSE u.id::text END
  FROM auth.users AS u
ON CONFLICT (id) DO NOTHING;

COMMIT;
