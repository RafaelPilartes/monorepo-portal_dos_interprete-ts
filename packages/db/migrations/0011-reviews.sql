-- 0011 — reviews between the parties of a completed service (step H9; reviews.md R-REV-01..05,
-- data-model.md §5 "booking.reviews").
BEGIN;

CREATE TABLE booking.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES booking.request_assignments (id),
  request_id uuid NOT NULL REFERENCES booking.requests (id),
  author_account uuid NOT NULL REFERENCES identity.profiles (id),
  author_role text NOT NULL CHECK (author_role IN ('requester', 'interpreter')),
  target_account uuid NOT NULL REFERENCES identity.profiles (id),
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text CHECK (length(comment) <= 2000),
  submitted_at timestamptz NOT NULL,
  revealed_at timestamptz,
  hidden boolean NOT NULL DEFAULT false,
  hidden_by uuid REFERENCES identity.profiles (id),
  hidden_reason text,
  hidden_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (author_account <> target_account),
  CHECK (hidden = (hidden_reason IS NOT NULL)),
  -- R-REV-01: one review per side per assignment.
  CONSTRAINT reviews_one_per_side UNIQUE (assignment_id, author_role)
);
ALTER TABLE booking.reviews ENABLE ROW LEVEL SECURITY;
CREATE INDEX reviews_assignment_idx ON booking.reviews (assignment_id);
CREATE INDEX reviews_request_idx ON booking.reviews (request_id);
CREATE INDEX reviews_author_idx ON booking.reviews (author_account);
CREATE INDEX reviews_target_idx ON booking.reviews (target_account, author_role);
CREATE INDEX reviews_hidden_by_idx ON booking.reviews (hidden_by);
CREATE INDEX reviews_unrevealed_idx ON booking.reviews (submitted_at) WHERE revealed_at IS NULL;
CREATE TRIGGER reviews_set_updated_at BEFORE UPDATE ON booking.reviews
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

COMMIT;
