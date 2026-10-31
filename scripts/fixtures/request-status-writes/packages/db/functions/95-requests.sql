CREATE OR REPLACE FUNCTION booking.accept_assignment(p_id uuid) RETURNS void
  LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE booking.requests SET status = 'confirmed' WHERE id = p_id;
END;
$$;
