CREATE OR REPLACE FUNCTION booking.refresh_request_status(p_id uuid) RETURNS void
  LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE booking.requests SET status = 'confirmed' WHERE id = p_id;
END;
$$;

CREATE OR REPLACE FUNCTION booking.reduce(p_id uuid) RETURNS void
  LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE booking.requests SET interpreters_needed = 1 WHERE id = p_id;
END;
$$;
