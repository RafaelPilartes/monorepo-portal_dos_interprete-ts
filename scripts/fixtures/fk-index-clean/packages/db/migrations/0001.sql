BEGIN;
CREATE TABLE util.parent (id uuid PRIMARY KEY);
CREATE TABLE util.child (
  parent_id uuid PRIMARY KEY REFERENCES util.parent (id),
  other_id uuid REFERENCES util.parent (id),
  a uuid,
  b uuid,
  note text DEFAULT 'REFERENCES, (',
  PRIMARY KEY (a, b),
  CONSTRAINT pair_fk FOREIGN KEY (a, b) REFERENCES util.pair (x, y)
);
CREATE INDEX child_other_idx ON util.child USING btree (other_id DESC) WHERE other_id IS NOT NULL;
ALTER TABLE util.child ADD FOREIGN KEY (a) REFERENCES util.parent (id);
COMMIT;
