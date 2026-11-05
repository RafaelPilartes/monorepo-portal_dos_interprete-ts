-- Grants of step H7 (api.md §7).
GRANT SELECT ON booking.open_requests_for_me TO authenticated;
GRANT EXECUTE ON FUNCTION auth_helper.open_requests_for_me() TO authenticated;
GRANT EXECUTE ON FUNCTION booking.accept_open_request(uuid, uuid), booking.apply_to_request(uuid, uuid, text),
  booking.withdraw_application(uuid, uuid), booking.select_candidate(uuid, uuid, uuid) TO service_role;
