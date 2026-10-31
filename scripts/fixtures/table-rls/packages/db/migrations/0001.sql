BEGIN;
CREATE TABLE util.with_rls (id int);
ALTER TABLE util.with_rls ENABLE ROW LEVEL SECURITY;
CREATE TABLE util.without_rls (id int);
CREATE TABLE unqualified (id int);
-- CREATE TABLE util.commented (id int);
ALTER TABLE util.with_rls DISABLE ROW LEVEL SECURITY;
COMMIT;
