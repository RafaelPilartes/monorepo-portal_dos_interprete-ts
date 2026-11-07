-- Grants of step H6 (api.md §8).
GRANT SELECT ON booking.proposals, booking.proposal_details TO authenticated;
GRANT SELECT ON booking.proposals TO service_role;
GRANT EXECUTE ON FUNCTION booking.make_proposal(uuid, uuid, bigint), booking.respond_proposal(uuid, uuid, boolean)
  TO service_role;
