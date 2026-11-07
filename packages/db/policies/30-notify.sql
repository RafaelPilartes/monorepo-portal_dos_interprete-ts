-- notify policies (data-model.md §10). Reapplicable: drop, then create.
-- notifications: the owner reads them and marks them read (R-NOT-05; the column grant is in
-- grants/). kinds and email_outbox have no policy: no access through the user's session.
DROP POLICY IF EXISTS notifications_select_own ON notify.notifications;
CREATE POLICY notifications_select_own ON notify.notifications
  FOR SELECT TO authenticated
  USING (account_id = (SELECT auth_helper.account_id()));

DROP POLICY IF EXISTS notifications_update_own ON notify.notifications;
CREATE POLICY notifications_update_own ON notify.notifications
  FOR UPDATE TO authenticated
  USING (account_id = (SELECT auth_helper.account_id()))
  WITH CHECK (account_id = (SELECT auth_helper.account_id()));
