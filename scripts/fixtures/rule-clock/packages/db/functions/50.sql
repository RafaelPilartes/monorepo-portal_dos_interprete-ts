CREATE OR REPLACE FUNCTION booking.expire() RETURNS void
  LANGUAGE sql SECURITY DEFINER SET search_path = ''
AS $$
  UPDATE booking.requests SET expired_at = now() WHERE starts_at < CURRENT_TIMESTAMP;
$$;
