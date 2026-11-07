-- 0007 — requests, assignments, chat and the request log (step H5; requests-core.md,
-- requests-direct.md, data-model.md §5). Negotiation (proposals) is H6; disputes and reviews come
-- with the service lifecycle; the columns of the other kinds are here so the table is whole.
BEGIN;

CREATE TABLE booking.requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('direct', 'open', 'managed')),
  open_mode text CHECK (open_mode IN ('first_accept', 'requester_chooses')),
  created_by uuid NOT NULL REFERENCES identity.profiles (id),
  organization_id uuid REFERENCES identity.organizations (id),
  service_id uuid NOT NULL REFERENCES catalog.services (id),
  modality text NOT NULL CHECK (modality IN ('online', 'in_person')),
  starts_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL CHECK (duration_minutes BETWEEN 15 AND 720),
  -- starts_at + duration; set by a trigger (timestamptz + interval is not immutable, so it cannot
  -- be a generated column).
  ends_at timestamptz NOT NULL,
  meeting_link text CHECK (meeting_link ~ '^https://'),
  address text CHECK (length(address) <= 300),
  city text CHECK (length(city) <= 120),
  notes text CHECK (length(notes) <= 2000),
  beneficiary_name text CHECK (length(beneficiary_name) <= 160),
  beneficiary_contact text CHECK (length(beneficiary_contact) <= 160),
  interpreters_needed integer NOT NULL CHECK (interpreters_needed >= 1),
  budget_per_interpreter_aoa bigint CHECK (budget_per_interpreter_aoa > 0),
  managed_unit_price_aoa bigint CHECK (managed_unit_price_aoa > 0),
  is_urgent boolean NOT NULL,
  config_version_id uuid NOT NULL REFERENCES config.platform_versions (id),
  status text NOT NULL CHECK (status IN ('awaiting_approval', 'quoting', 'awaiting_interpreters', 'awaiting_payment',
    'payment_review', 'confirmed', 'delivered', 'disputed', 'completed', 'cancelled', 'expired')),
  approved_by uuid REFERENCES identity.profiles (id),
  approved_at timestamptz,
  cancelled_by uuid REFERENCES identity.profiles (id),
  cancelled_by_role text CHECK (cancelled_by_role IN ('requester', 'interpreter', 'staff', 'system')),
  cancelled_at timestamptz,
  cancel_reason text,
  understaffed_warned_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT requests_code_key UNIQUE (code),
  CONSTRAINT requests_online_link CHECK (modality <> 'online' OR meeting_link IS NOT NULL),
  CONSTRAINT requests_in_person_address CHECK (modality <> 'in_person' OR address IS NOT NULL),
  CONSTRAINT requests_open_mode CHECK ((kind = 'open') = (open_mode IS NOT NULL)),
  CONSTRAINT requests_first_accept_budget CHECK (open_mode IS DISTINCT FROM 'first_accept' OR budget_per_interpreter_aoa IS NOT NULL)
);
ALTER TABLE booking.requests ENABLE ROW LEVEL SECURITY;
CREATE INDEX requests_created_by_idx ON booking.requests (created_by, starts_at DESC);
CREATE INDEX requests_organization_idx ON booking.requests (organization_id, starts_at DESC);
CREATE INDEX requests_service_idx ON booking.requests (service_id);
CREATE INDEX requests_config_version_idx ON booking.requests (config_version_id);
CREATE INDEX requests_status_idx ON booking.requests (status, starts_at);
CREATE INDEX requests_approved_by_idx ON booking.requests (approved_by);
CREATE INDEX requests_cancelled_by_idx ON booking.requests (cancelled_by);
CREATE TRIGGER requests_set_updated_at BEFORE UPDATE ON booking.requests
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();
CREATE FUNCTION booking.set_request_ends_at() RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = ''
AS $$
BEGIN
  NEW.ends_at := NEW.starts_at + NEW.duration_minutes * interval '1 minute';
  RETURN NEW;
END;
$$;
CREATE TRIGGER requests_set_ends_at BEFORE INSERT OR UPDATE OF starts_at, duration_minutes ON booking.requests
  FOR EACH ROW EXECUTE FUNCTION booking.set_request_ends_at();

CREATE TABLE booking.request_languages (
  request_id uuid NOT NULL REFERENCES booking.requests (id) ON DELETE CASCADE,
  language_id uuid NOT NULL REFERENCES catalog.languages (id),
  PRIMARY KEY (request_id, language_id)
);
ALTER TABLE booking.request_languages ENABLE ROW LEVEL SECURITY;
CREATE INDEX request_languages_language_idx ON booking.request_languages (language_id);

CREATE TABLE booking.request_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES booking.requests (id) ON DELETE CASCADE,
  interpreter_id uuid NOT NULL REFERENCES identity.interpreter_profiles (account_id),
  origin text NOT NULL CHECK (origin IN ('invited', 'applied', 'team_assigned')),
  status text NOT NULL CHECK (status IN ('invited', 'applied', 'accepted', 'declined', 'expired', 'not_selected',
    'withdrawn', 'cancelled', 'delivered', 'disputed', 'completed')),
  offered_price_aoa bigint CHECK (offered_price_aoa >= 0),
  offered_travel_fee_aoa bigint CHECK (offered_travel_fee_aoa >= 0),
  agreed_price_aoa bigint CHECK (agreed_price_aoa >= 0),
  agreed_travel_fee_aoa bigint CHECK (agreed_travel_fee_aoa >= 0),
  interpreter_share_aoa bigint CHECK (interpreter_share_aoa >= 0),
  period tstzrange,
  invite_expires_at timestamptz,
  responded_at timestamptz,
  decline_reason text,
  cancel_reason text,
  cancelled_by_role text CHECK (cancelled_by_role IN ('requester', 'interpreter', 'staff', 'system')),
  late_cancellation boolean NOT NULL DEFAULT false,
  delivered_at timestamptz,
  completed_at timestamptz,
  completed_via text CHECK (completed_via IN ('requester', 'auto', 'staff')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (request_id, interpreter_id),
  -- R-REQ-05 (D-23): no two accepted or delivered services of one interpreter overlap.
  CONSTRAINT request_assignments_no_overlap EXCLUDE USING gist (interpreter_id WITH =, period WITH &&)
    WHERE (status IN ('accepted', 'delivered')),
  CONSTRAINT request_assignments_period_when_active CHECK (status NOT IN ('accepted', 'delivered') OR period IS NOT NULL)
);
ALTER TABLE booking.request_assignments ENABLE ROW LEVEL SECURITY;
CREATE INDEX request_assignments_interpreter_idx ON booking.request_assignments (interpreter_id, status);
CREATE INDEX request_assignments_invites_due_idx ON booking.request_assignments (invite_expires_at) WHERE status = 'invited';
CREATE TRIGGER request_assignments_set_updated_at BEFORE UPDATE ON booking.request_assignments
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

-- Chat (R-REQ-08): one thread per requester–interpreter pair; the requester–team thread of the
-- managed request has no assignment.
CREATE TABLE booking.threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES booking.requests (id) ON DELETE CASCADE,
  assignment_id uuid REFERENCES booking.request_assignments (id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('requester_interpreter', 'requester_team')),
  closes_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((kind = 'requester_interpreter') = (assignment_id IS NOT NULL))
);
ALTER TABLE booking.threads ENABLE ROW LEVEL SECURITY;
CREATE INDEX threads_request_idx ON booking.threads (request_id);
CREATE UNIQUE INDEX threads_assignment_key ON booking.threads (assignment_id) WHERE assignment_id IS NOT NULL;
CREATE UNIQUE INDEX threads_team_key ON booking.threads (request_id) WHERE kind = 'requester_team';

CREATE TABLE booking.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES booking.threads (id),
  sender_account uuid NOT NULL REFERENCES identity.profiles (id),
  sender_role text NOT NULL CHECK (sender_role IN ('requester', 'interpreter', 'staff')),
  body text NOT NULL CHECK (length(trim(body)) BETWEEN 1 AND 4000),
  attachment_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE booking.messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX messages_thread_idx ON booking.messages (thread_id, created_at);
CREATE INDEX messages_sender_idx ON booking.messages (sender_account);
CREATE TRIGGER messages_append_only BEFORE UPDATE OR DELETE ON booking.messages
  FOR EACH ROW EXECUTE FUNCTION util.forbid_mutation();

CREATE TABLE booking.thread_reads (
  thread_id uuid NOT NULL REFERENCES booking.threads (id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES identity.profiles (id) ON DELETE CASCADE,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (thread_id, account_id)
);
ALTER TABLE booking.thread_reads ENABLE ROW LEVEL SECURITY;
CREATE INDEX thread_reads_account_idx ON booking.thread_reads (account_id);

-- R-REQ-11: the request log, append-only, written only by booking.log_event. Requests are never
-- deleted (they end cancelled or expired), so the append-only children reference them plainly.
CREATE TABLE booking.request_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  request_id uuid NOT NULL REFERENCES booking.requests (id),
  assignment_id uuid REFERENCES booking.request_assignments (id),
  from_status text,
  to_status text NOT NULL,
  -- No foreign key, like audit.events: the log outlives the account (R-AUD-01).
  actor_account uuid,
  actor_role text NOT NULL CHECK (actor_role IN ('requester', 'interpreter', 'staff', 'system')),
  reason text,
  at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE booking.request_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX request_events_request_idx ON booking.request_events (request_id, at);
CREATE INDEX request_events_assignment_idx ON booking.request_events (assignment_id);
CREATE TRIGGER request_events_append_only BEFORE UPDATE OR DELETE ON booking.request_events
  FOR EACH ROW EXECUTE FUNCTION util.forbid_mutation();

-- R-REQ-06: after the first acceptance the service, the modality, the date, the time, the
-- duration, the address, the kind and the mode do not change (REQUEST_LOCKED).
CREATE FUNCTION booking.guard_request_immutables() RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = ''
AS $$
BEGIN
  IF (NEW.service_id, NEW.modality, NEW.starts_at, NEW.duration_minutes, NEW.address, NEW.kind, NEW.open_mode)
     IS DISTINCT FROM (OLD.service_id, OLD.modality, OLD.starts_at, OLD.duration_minutes, OLD.address, OLD.kind, OLD.open_mode)
     AND EXISTS (SELECT 1 FROM booking.request_assignments AS a
                  WHERE a.request_id = OLD.id AND a.status IN ('accepted', 'delivered', 'disputed', 'completed')) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'REQUEST_LOCKED',
      DETAIL = format('request %s has an accepted interpreter', OLD.id);
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER requests_guard_immutables BEFORE UPDATE ON booking.requests
  FOR EACH ROW EXECUTE FUNCTION booking.guard_request_immutables();

COMMIT;
