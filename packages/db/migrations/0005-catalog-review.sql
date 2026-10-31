-- 0005 — fixes from the H3 review (AD-032). 0004 stays as it was applied.
BEGIN;

-- A table price of 0 would publish a free service on the site: the price is positive.
-- Same name as before, so the error map still points at the field.
ALTER TABLE catalog.services
  DROP CONSTRAINT services_platform_price_aoa_check,
  ADD CONSTRAINT services_platform_price_aoa_check CHECK (platform_price_aoa > 0);

-- The reason names its rule, so the error map does not hold a bare "locked".
CREATE OR REPLACE FUNCTION catalog.guard_service_pricing_mode() RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = ''
AS $$
BEGIN
  IF NEW.pricing_mode IS DISTINCT FROM OLD.pricing_mode AND catalog.usage_count('service', OLD.id) > 0 THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'VALIDATION_FAILED', HINT = 'pricing_mode:pricing_mode_locked',
      DETAIL = format('service %s is used: its pricing mode cannot change', OLD.id);
  END IF;
  RETURN NEW;
END;
$$;

COMMIT;
