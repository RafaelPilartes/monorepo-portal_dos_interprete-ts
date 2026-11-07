-- 0010 — the service lifecycle: disputes (step H8; service-lifecycle.md R-LIFE-05, R-LIFE-06,
-- data-model.md §5 "booking.disputes").
BEGIN;

CREATE TABLE booking.disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES booking.request_assignments (id),
  request_id uuid NOT NULL REFERENCES booking.requests (id),
  opened_by uuid NOT NULL REFERENCES identity.profiles (id),
  opened_by_role text NOT NULL CHECK (opened_by_role IN ('requester', 'interpreter')),
  reason text NOT NULL CHECK (length(trim(reason)) BETWEEN 3 AND 2000),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  resolution text CHECK (resolution IN ('completed', 'cancelled')),
  -- Only in the managed request (H11).
  refund_decision text CHECK (refund_decision IN ('full', 'policy', 'none')),
  resolved_by uuid REFERENCES identity.profiles (id),
  resolved_at timestamptz,
  notes text CHECK (length(notes) <= 4000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((status = 'resolved') = (resolution IS NOT NULL))
);
ALTER TABLE booking.disputes ENABLE ROW LEVEL SECURITY;
-- R-LIFE-05: one open dispute per assignment.
CREATE UNIQUE INDEX disputes_one_open ON booking.disputes (assignment_id) WHERE status = 'open';
CREATE INDEX disputes_assignment_idx ON booking.disputes (assignment_id);
CREATE INDEX disputes_request_idx ON booking.disputes (request_id);
CREATE INDEX disputes_opened_by_idx ON booking.disputes (opened_by);
CREATE INDEX disputes_resolved_by_idx ON booking.disputes (resolved_by);
CREATE INDEX disputes_open_idx ON booking.disputes (status, created_at) WHERE status = 'open';
CREATE TRIGGER disputes_set_updated_at BEFORE UPDATE ON booking.disputes
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

COMMIT;
