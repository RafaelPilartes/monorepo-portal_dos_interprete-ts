CREATE OR REPLACE FUNCTION booking.expire() RETURNS void
  LANGUAGE sql SECURITY DEFINER SET search_path = ''
AS $$
  UPDATE booking.requests SET expired_at = now() WHERE starts_at < CURRENT_TIMESTAMP;
$$;
CREATE FUNCTION booking.f1() RETURNS void LANGUAGE sql
AS 'UPDATE booking.a SET id = id WHERE util.now() > current_date';
CREATE FUNCTION booking.f2() RETURNS timestamptz LANGUAGE sql
AS $$ SELECT pg_catalog.now() + (LOCALTIMESTAMP - LOCALTIMESTAMP) $$;
CREATE FUNCTION support.f3() RETURNS boolean LANGUAGE sql
AS $$ SELECT util.now() > 'now'::timestamptz $$;
