-- 0001 — foundation: schemas, extensions, shared domains and the tables every feature leans on
-- (foundation.md §F, architecture.md §5, data-model.md §0, §10, §11, §12).
-- Functions that features will keep changing live in packages/db/functions/ (reapplicable);
-- only the trigger functions that tables need at creation time are here.
BEGIN;

-- Schemas by domain (architecture.md §5) -----------------------------------------------------
CREATE SCHEMA identity;
CREATE SCHEMA catalog;
CREATE SCHEMA directory;
CREATE SCHEMA config;
CREATE SCHEMA booking;
CREATE SCHEMA billing;
CREATE SCHEMA verification;
CREATE SCHEMA community;
CREATE SCHEMA support;
CREATE SCHEMA notify;
CREATE SCHEMA audit;
CREATE SCHEMA analytics;
CREATE SCHEMA util;
CREATE SCHEMA auth_helper;

-- Born closed: nothing the project creates is usable by PUBLIC unless granted by name.
REVOKE ALL ON SCHEMA identity, catalog, directory, config, booking, billing, verification,
  community, support, notify, audit, analytics, util, auth_helper FROM PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres REVOKE USAGE ON TYPES FROM PUBLIC;

-- PostgREST reaches the exposed schemas; table access still needs grants and RLS policies.
GRANT USAGE ON SCHEMA identity, catalog, directory, config, booking, billing, verification,
  community, support, notify, audit, analytics, auth_helper TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA util TO service_role;

-- Extensions --------------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- Shared domains (data-model.md §0). The same expressions live in packages/core/src/patterns.ts;
-- scripts/verify.py compares them (R-CFG-05).
CREATE DOMAIN util.phone_e164 AS text CHECK (VALUE ~ '^\+[1-9][0-9]{7,14}$');
CREATE DOMAIN util.nif AS text CHECK (VALUE ~ '^[0-9A-Z]{9,14}$');
CREATE DOMAIN util.iban_ao AS text CHECK (VALUE ~ '^AO06[0-9]{21}$');
CREATE DOMAIN util.slug AS text CHECK (VALUE ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
CREATE DOMAIN util.email AS extensions.citext CHECK (VALUE ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$');
-- A link inside the portal: one leading slash, never "//host" or "/\host" (which leave the site).
CREATE DOMAIN util.relative_link AS text CHECK (VALUE ~ '^/([^/\\]|$)');
GRANT USAGE ON DOMAIN util.phone_e164, util.nif, util.iban_ao, util.slug, util.email, util.relative_link
  TO anon, authenticated, service_role;

-- Trigger functions -------------------------------------------------------------------------------
CREATE FUNCTION util.set_updated_at() RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- Append-only tables (D-62, R-AUD-01): refuses UPDATE, DELETE and TRUNCATE for every role,
-- service_role and the table owner included.
CREATE FUNCTION util.forbid_mutation() RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION USING
    ERRCODE = 'P0001',
    MESSAGE = 'FORBIDDEN',
    DETAIL = format('%I.%I is append-only: %s refused', TG_TABLE_SCHEMA, TG_TABLE_NAME, TG_OP);
END;
$$;

-- util: migration registry and readable-code sequences -----------------------------------------
CREATE TABLE util.applied_migrations (
  name text PRIMARY KEY,
  sha256 text NOT NULL CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  applied_at timestamptz NOT NULL DEFAULT now(),
  marked_only boolean NOT NULL DEFAULT false
);
ALTER TABLE util.applied_migrations ENABLE ROW LEVEL SECURITY;

-- The test clock (claude-code-rules.md §5): util.now() returns frozen_at while this table has a
-- row. Only the owner writes it (no grants, RLS on), and tests insert it inside a transaction that
-- is rolled back, so no session can move the clock of another.
CREATE TABLE util.test_clock (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  frozen_at timestamptz NOT NULL
);
ALTER TABLE util.test_clock ENABLE ROW LEVEL SECURITY;

-- One counter per prefix and year, used by util.next_code (PI-2026-000123).
CREATE TABLE util.code_sequences (
  prefix text NOT NULL CHECK (prefix ~ '^[A-Z]{2,5}$'),
  year integer NOT NULL CHECK (year BETWEEN 2000 AND 9999),
  last_value bigint NOT NULL DEFAULT 0 CHECK (last_value >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (prefix, year)
);
ALTER TABLE util.code_sequences ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER code_sequences_set_updated_at BEFORE UPDATE ON util.code_sequences
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

-- audit (data-model.md §11) -------------------------------------------------------------------
-- actor_account has no foreign key on purpose: an append-only row cannot be nulled when an
-- account is deleted, and the trail must outlive the account (R-AUD-01).
CREATE TABLE audit.events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  actor_account uuid,
  actor_role text NOT NULL CHECK (actor_role <> ''),
  action text NOT NULL CHECK (action <> ''),
  entity_type text NOT NULL CHECK (entity_type <> ''),
  entity_id text,
  before jsonb,
  after jsonb,
  request_id text,
  ip inet,
  note text
);
ALTER TABLE audit.events ENABLE ROW LEVEL SECURITY;
CREATE INDEX events_entity_idx ON audit.events (entity_type, entity_id, occurred_at DESC);
CREATE INDEX events_actor_idx ON audit.events (actor_account, occurred_at DESC);
CREATE INDEX events_occurred_at_idx ON audit.events (occurred_at DESC);
CREATE TRIGGER events_forbid_update_delete BEFORE UPDATE OR DELETE ON audit.events
  FOR EACH ROW EXECUTE FUNCTION util.forbid_mutation();
CREATE TRIGGER events_forbid_truncate BEFORE TRUNCATE ON audit.events
  FOR EACH STATEMENT EXECUTE FUNCTION util.forbid_mutation();

-- notify (data-model.md §10, specs/notifications.md) -----------------------------------------
-- The catalog of notification kinds; loaded by packages/db/seed (R-NOT-01).
CREATE TABLE notify.kinds (
  code text PRIMARY KEY CHECK (code ~ '^[a-z][a-z0-9_]*$'),
  channels text[] NOT NULL CHECK (cardinality(channels) > 0 AND channels <@ ARRAY['portal', 'email'])
);
ALTER TABLE notify.kinds ENABLE ROW LEVEL SECURITY;

-- In-portal notifications. The portal renders title and body from packages/i18n by kind and
-- payload (R-NOT-01, AD-023); written only by notify.enqueue (R-NOT-02).
CREATE TABLE notify.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  kind text NOT NULL REFERENCES notify.kinds (code),
  payload jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(payload) = 'object'),
  link util.relative_link,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE notify.notifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX notifications_account_id_idx ON notify.notifications (account_id, created_at DESC);
CREATE INDEX notifications_unread_idx ON notify.notifications (account_id) WHERE read_at IS NULL;
CREATE INDEX notifications_kind_idx ON notify.notifications (kind);
CREATE TRIGGER notifications_set_updated_at BEFORE UPDATE ON notify.notifications
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

-- Emails waiting for the API worker (R-NOT-03).
CREATE TABLE notify.email_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  to_email util.email NOT NULL,
  template text NOT NULL REFERENCES notify.kinds (code),
  payload jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(payload) = 'object'),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sending', 'sent', 'failed')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  last_error text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((status = 'sent') = (sent_at IS NOT NULL))
);
ALTER TABLE notify.email_outbox ENABLE ROW LEVEL SECURITY;
CREATE INDEX email_outbox_account_id_idx ON notify.email_outbox (account_id);
CREATE INDEX email_outbox_template_idx ON notify.email_outbox (template);
CREATE INDEX email_outbox_due_idx ON notify.email_outbox (next_attempt_at) WHERE status = 'queued';
CREATE INDEX email_outbox_failed_idx ON notify.email_outbox (created_at DESC) WHERE status = 'failed';
CREATE TRIGGER email_outbox_set_updated_at BEFORE UPDATE ON notify.email_outbox
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

COMMIT;
