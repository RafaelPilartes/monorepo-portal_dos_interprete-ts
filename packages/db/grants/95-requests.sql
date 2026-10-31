-- Grants of step H5 (api.md §7, §16).
-- No SELECT on booking.requests itself: its private fields (D-95) are read only through
-- booking.request_details, which masks them (review of H5).
GRANT SELECT ON booking.request_languages, booking.threads, booking.messages, booking.thread_reads,
  booking.request_details, booking.assignment_details, booking.my_assignments, booking.request_timeline TO authenticated;
GRANT INSERT (thread_id, sender_account, body) ON booking.messages TO authenticated;
-- The read mark is an upsert: PostgREST's ON CONFLICT updates every column it sends.
GRANT INSERT (thread_id, account_id, last_read_at), UPDATE (thread_id, account_id, last_read_at) ON booking.thread_reads TO authenticated;
GRANT SELECT ON booking.requests, booking.request_assignments, booking.request_events, booking.threads, booking.messages,
  booking.request_details TO service_role;

GRANT EXECUTE ON FUNCTION auth_helper.can_view_request(uuid), auth_helper.can_see_request_private(uuid),
  auth_helper.is_thread_participant(uuid), auth_helper.requester_accounts(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION
  catalog.quote_service(uuid, bigint, integer, uuid),
  booking.preview_request_total(jsonb),
  booking.create_request(uuid, jsonb),
  booking.invite_interpreter(uuid, uuid, uuid),
  booking.accept_assignment(uuid, uuid),
  booking.decline_assignment(uuid, uuid, text),
  booking.reduce_interpreters_needed(uuid, uuid, integer),
  booking.update_meeting_link(uuid, uuid, text),
  booking.refresh_request_status(uuid, uuid, text),
  booking.expire_invites(),
  booking.warn_understaffed(),
  booking.expire_unstaffed_requests(),
  directory.is_eligible_for(uuid, uuid)
  TO service_role;
