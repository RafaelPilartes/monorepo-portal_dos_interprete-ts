-- 0009 — the open request (step H7; requests-open.md R-OPN-03): the candidate's message.
BEGIN;

ALTER TABLE booking.request_assignments
  ADD COLUMN application_message text CHECK (length(application_message) <= 1000);

COMMIT;
