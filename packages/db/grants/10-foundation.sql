-- Grants for the foundation (migration 0001). Reapplicable; 00-reset.sql runs first.

-- The API (service_role) reads; it writes only through the functions below.
GRANT SELECT ON util.applied_migrations, audit.events, notify.kinds, notify.notifications,
  notify.email_outbox TO service_role;

-- R-NOT-05: the owner marks a notification read; nothing else is writable from the session.
GRANT SELECT ON notify.notifications TO authenticated;
GRANT UPDATE (read_at) ON notify.notifications TO authenticated;

GRANT EXECUTE ON FUNCTION util.app_timezone(), util.now(), util.next_code(text) TO service_role;
GRANT EXECUTE ON FUNCTION audit.record(uuid, text, text, text, text, jsonb, jsonb, text, inet, text)
  TO service_role;
GRANT EXECUTE ON FUNCTION notify.enqueue(text, uuid, jsonb), notify.enqueue_email(text, text, jsonb)
  TO service_role;
GRANT EXECUTE ON FUNCTION auth_helper.account_id(), auth_helper.is_active() TO authenticated, service_role;
