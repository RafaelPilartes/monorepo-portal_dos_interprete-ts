BEGIN;
CREATE TABLE util.parent (id uuid PRIMARY KEY);
CREATE TABLE util.child (
  id uuid PRIMARY KEY,
  parent_id uuid NOT NULL REFERENCES util.parent (id),
  other_id uuid REFERENCES util.parent (id),
  a uuid,
  b uuid,
  FOREIGN KEY (a, b) REFERENCES util.pair (x, y)
);
CREATE INDEX child_other_idx ON util.child (other_id, id);
CREATE INDEX child_b_idx ON util.child (b, a);
ALTER TABLE util.child ADD CONSTRAINT late_fk FOREIGN KEY (a) REFERENCES util.parent (id);
COMMIT;
