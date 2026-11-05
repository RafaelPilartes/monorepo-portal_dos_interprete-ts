-- Policies of step H6: proposals are read through booking.proposal_details (participants); the
-- table only by the participants too. Writes only through the API.
DROP POLICY IF EXISTS proposals_select ON booking.proposals;
CREATE POLICY proposals_select ON booking.proposals FOR SELECT TO authenticated
  USING ((SELECT auth_helper.is_thread_participant(thread_id)));
