-- Grants of step H9 (api.md §7). booking.reviews is read only through booking.review_details.
GRANT SELECT ON booking.review_details, booking.requester_ratings, booking.reviews_to_do TO authenticated;
GRANT SELECT ON directory.interpreter_ratings TO anon, authenticated;
GRANT SELECT ON booking.reviews, booking.review_details, directory.interpreter_ratings, booking.requester_ratings TO service_role;
GRANT EXECUTE ON FUNCTION auth_helper.can_view_requester_reviews(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION
  booking.submit_review(uuid, uuid, integer, text),
  booking.hide_review(uuid, uuid, text),
  booking.reveal_reviews()
  TO service_role;
