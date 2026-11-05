-- 0008 — price negotiation (step H6; negotiation.md, data-model.md §5 "booking.proposals", D-13).
BEGIN;

CREATE TABLE booking.proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES booking.threads (id),
  request_id uuid NOT NULL REFERENCES booking.requests (id),
  -- NULL in the managed request's requester–team thread (H11).
  assignment_id uuid REFERENCES booking.request_assignments (id),
  proposed_by uuid NOT NULL REFERENCES identity.profiles (id),
  proposed_by_role text NOT NULL CHECK (proposed_by_role IN ('requester', 'interpreter', 'staff')),
  -- R-NEG-05: per interpreter, whole kwanzas, without the travel fee; for an hourly service, the
  -- total of the service, not the hourly price.
  amount_aoa bigint NOT NULL CHECK (amount_aoa > 0),
  -- The price in force when it was made, to show "era 15 000 Kz".
  previous_amount_aoa bigint CHECK (previous_amount_aoa >= 0),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'accepted', 'rejected', 'void')),
  responded_by uuid REFERENCES identity.profiles (id),
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE booking.proposals ENABLE ROW LEVEL SECURITY;
-- R-NEG-02: at most one open proposal per thread.
CREATE UNIQUE INDEX proposals_one_open_per_thread ON booking.proposals (thread_id) WHERE status = 'open';
CREATE INDEX proposals_thread_idx ON booking.proposals (thread_id, created_at);
CREATE INDEX proposals_request_idx ON booking.proposals (request_id);
CREATE INDEX proposals_assignment_idx ON booking.proposals (assignment_id);
CREATE INDEX proposals_proposed_by_idx ON booking.proposals (proposed_by);
CREATE INDEX proposals_responded_by_idx ON booking.proposals (responded_by);
CREATE TRIGGER proposals_set_updated_at BEFORE UPDATE ON booking.proposals
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

COMMIT;
