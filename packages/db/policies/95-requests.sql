-- Policies of step H5 (data-model.md §5). Requests, assignments and the log are read through the
-- views (definer, they filter); the tables themselves only for who may see the request. Writes
-- only through the API, except chat messages and read marks (participants, open thread).
DROP POLICY IF EXISTS requests_select ON booking.requests;
CREATE POLICY requests_select ON booking.requests FOR SELECT TO authenticated
  USING ((SELECT auth_helper.can_view_request(id)));
DROP POLICY IF EXISTS request_languages_select ON booking.request_languages;
CREATE POLICY request_languages_select ON booking.request_languages FOR SELECT TO authenticated
  USING ((SELECT auth_helper.can_view_request(request_id)));

DROP POLICY IF EXISTS threads_select ON booking.threads;
CREATE POLICY threads_select ON booking.threads FOR SELECT TO authenticated
  USING ((SELECT auth_helper.is_thread_participant(id)));

-- R-REQ-08: participants read and write; a closed thread is read, never written. The team reads
-- the requester–interpreter threads through the API (R-PRIV-05), not here.
DROP POLICY IF EXISTS messages_select ON booking.messages;
CREATE POLICY messages_select ON booking.messages FOR SELECT TO authenticated
  USING ((SELECT auth_helper.is_thread_participant(thread_id)));
DROP POLICY IF EXISTS messages_insert ON booking.messages;
CREATE POLICY messages_insert ON booking.messages FOR INSERT TO authenticated
  WITH CHECK (sender_account = (SELECT auth_helper.account_id())
              AND (SELECT auth_helper.is_thread_participant(thread_id))
              AND NOT EXISTS (SELECT 1 FROM booking.threads AS t WHERE t.id = thread_id AND t.closes_at <= now()));

DROP POLICY IF EXISTS thread_reads_own ON booking.thread_reads;
CREATE POLICY thread_reads_own ON booking.thread_reads FOR ALL TO authenticated
  USING (account_id = (SELECT auth_helper.account_id()))
  WITH CHECK (account_id = (SELECT auth_helper.account_id()) AND (SELECT auth_helper.is_thread_participant(thread_id)));
