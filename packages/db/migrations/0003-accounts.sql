-- 0003 — accounts, roles, organisations, invites, consent (step H2; accounts-and-organizations.md,
-- personal-data.md R-PRIV-01/02, data-model.md §1). Payout details arrive in H10, deletion requests
-- in H14.
BEGIN;

-- identity.requester_profiles: the individual requester role (R-ACC-01) ---------------------------
CREATE TABLE identity.requester_profiles (
  account_id uuid PRIMARY KEY REFERENCES identity.profiles (id) ON DELETE CASCADE,
  nif util.nif,
  address text CHECK (length(address) <= 300),
  city text CHECK (length(city) <= 120),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE identity.requester_profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER requester_profiles_set_updated_at BEFORE UPDATE ON identity.requester_profiles
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

-- identity.interpreter_profiles: the interpreter role (R-ACC-01, R-DIR-02); H4 fills it in -------
CREATE TABLE identity.interpreter_profiles (
  account_id uuid PRIMARY KEY REFERENCES identity.profiles (id) ON DELETE CASCADE,
  slug util.slug NOT NULL UNIQUE,
  bio text CHECK (length(bio) <= 4000),
  years_experience integer CHECK (years_experience >= 0 AND years_experience <= 70),
  modality text CHECK (modality IN ('online', 'in_person', 'both')),
  minimum_hourly_rate_aoa bigint CHECK (minimum_hourly_rate_aoa >= 0),
  accepts_negotiation boolean NOT NULL DEFAULT true,
  travel_fee_aoa bigint CHECK (travel_fee_aoa >= 0),
  city text CHECK (length(city) <= 120),
  contact_phone util.phone_e164,
  contact_whatsapp util.phone_e164,
  website_url text CHECK (website_url ~ '^https://'),
  linkedin_url text CHECK (linkedin_url ~ '^https://'),
  instagram_url text CHECK (instagram_url ~ '^https://'),
  facebook_url text CHECK (facebook_url ~ '^https://'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE identity.interpreter_profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER interpreter_profiles_set_updated_at BEFORE UPDATE ON identity.interpreter_profiles
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

-- identity.organizations (R-ORG-01) ---------------------------------------------------------------
CREATE TABLE identity.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 2 AND 160),
  nif util.nif NOT NULL,
  sector text CHECK (length(sector) <= 120),
  address text CHECK (length(address) <= 300),
  city text CHECK (length(city) <= 120),
  website_url text CHECK (website_url ~ '^https://'),
  phone util.phone_e164,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'anonymized')),
  suspended_at timestamptz,
  suspended_reason text,
  anonymized_at timestamptz,
  created_by uuid REFERENCES identity.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT organizations_nif_key UNIQUE (nif),
  CHECK ((status = 'suspended') = (suspended_at IS NOT NULL)),
  CHECK ((status = 'anonymized') = (anonymized_at IS NOT NULL))
);
ALTER TABLE identity.organizations ENABLE ROW LEVEL SECURITY;
CREATE INDEX organizations_created_by_idx ON identity.organizations (created_by);
CREATE TRIGGER organizations_set_updated_at BEFORE UPDATE ON identity.organizations
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

-- identity.organization_members (R-ORG-03, R-ORG-04) ----------------------------------------------
CREATE TABLE identity.organization_members (
  organization_id uuid NOT NULL REFERENCES identity.organizations (id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES identity.profiles (id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'removed')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  removed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, account_id),
  CHECK ((status = 'removed') = (removed_at IS NOT NULL))
);
ALTER TABLE identity.organization_members ENABLE ROW LEVEL SECURITY;
CREATE INDEX organization_members_account_idx ON identity.organization_members (account_id);
-- Exactly one active owner per organisation (R-ORG-03); "at least one" is kept by the functions.
CREATE UNIQUE INDEX organization_members_one_owner ON identity.organization_members (organization_id)
  WHERE role = 'owner' AND status = 'active';
CREATE TRIGGER organization_members_set_updated_at BEFORE UPDATE ON identity.organization_members
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

-- identity.organization_invites (R-ORG-02): the token goes by email; only its hash is kept --------
CREATE TABLE identity.organization_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES identity.organizations (id) ON DELETE CASCADE,
  email util.email NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'member')),
  token_hash text NOT NULL UNIQUE,
  invited_by uuid REFERENCES identity.profiles (id) ON DELETE SET NULL,
  expires_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  accepted_by uuid REFERENCES identity.profiles (id) ON DELETE SET NULL,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((status = 'pending') = (decided_at IS NULL)),
  CHECK ((status = 'accepted') = (accepted_by IS NOT NULL))
);
ALTER TABLE identity.organization_invites ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX organization_invites_one_pending ON identity.organization_invites (organization_id, email)
  WHERE status = 'pending';
CREATE INDEX organization_invites_invited_by_idx ON identity.organization_invites (invited_by);
CREATE INDEX organization_invites_accepted_by_idx ON identity.organization_invites (accepted_by);
CREATE INDEX organization_invites_expiry_idx ON identity.organization_invites (expires_at) WHERE status = 'pending';
CREATE TRIGGER organization_invites_set_updated_at BEFORE UPDATE ON identity.organization_invites
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

-- identity.consents (R-PRIV-01, R-PRIV-02): append-only --------------------------------------------
CREATE TABLE identity.consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- No cascade: consent is proof and outlives the account (anonymized, never deleted; R-PRIV-03).
  account_id uuid NOT NULL REFERENCES identity.profiles (id),
  legal_document_id uuid NOT NULL REFERENCES identity.legal_documents (id),
  accepted_at timestamptz NOT NULL DEFAULT now(),
  ip text,
  user_agent text CHECK (length(user_agent) <= 500),
  UNIQUE (account_id, legal_document_id)
);
ALTER TABLE identity.consents ENABLE ROW LEVEL SECURITY;
CREATE INDEX consents_legal_document_idx ON identity.consents (legal_document_id);
CREATE TRIGGER consents_append_only BEFORE UPDATE OR DELETE ON identity.consents
  FOR EACH ROW EXECUTE FUNCTION util.forbid_mutation();

COMMIT;
