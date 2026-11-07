-- now() in a comment is fine
CREATE OR REPLACE FUNCTION booking.expire() RETURNS void
  LANGUAGE sql SECURITY DEFINER SET search_path = ''
AS $$
  UPDATE booking.requests SET expired_at = util.now(), note = 'now()' WHERE starts_at < util.now();
$$;
CREATE OR REPLACE FUNCTION util.set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END; $$;
