-- Grants of step H8 (api.md §7). booking.disputes is read only through booking.dispute_details.
GRANT SELECT ON booking.dispute_details, directory.late_cancellations TO authenticated;
GRANT SELECT ON booking.disputes, booking.dispute_details, directory.late_cancellations TO service_role;
GRANT EXECUTE ON FUNCTION
  booking.cancel_request(uuid, uuid, text),
  booking.cancel_assignment(uuid, uuid, text),
  booking.mark_delivered(uuid, uuid),
  booking.confirm_delivery(uuid, uuid),
  booking.open_dispute(uuid, uuid, text),
  booking.resolve_dispute(uuid, uuid, text, text),
  booking.auto_confirm_deliveries()
  TO service_role;
GRANT EXECUTE ON FUNCTION auth_helper.cancel_is_late(uuid), auth_helper.confirmation_deadline(uuid) TO authenticated, service_role;
