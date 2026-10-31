-- Named assertions for step H3 (catalogs.md criteria 1–3; R-CAT-01, R-CAT-02). Rolled back.
-- c1 moderator, c2 finance, c3 interpreter.

INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
  ('00000000-0000-4000-8000-0000000000c1', 'mod@portal.ao', '{"full_name": "Mara Moderadora"}'),
  ('00000000-0000-4000-8000-0000000000c2', 'fin@portal.ao', '{"full_name": "Fábio Finanças"}'),
  ('00000000-0000-4000-8000-0000000000c3', 'int@exemplo.ao', '{"full_name": "Inês Intérprete"}');
INSERT INTO identity.consents (account_id, legal_document_id)
SELECT p.id, d.id FROM identity.profiles AS p CROSS JOIN LATERAL auth_helper.pending_legal_documents(p.id) AS d
 WHERE p.id::text LIKE '00000000-0000-4000-8000-0000000000c_';
UPDATE identity.staff_members SET active = false WHERE active;
INSERT INTO identity.staff_members (account_id, level) VALUES
  ('00000000-0000-4000-8000-0000000000c1', 'moderator'), ('00000000-0000-4000-8000-0000000000c2', 'finance');

DO $$
DECLARE v_service catalog.services; v_code text; v_hint text;
BEGIN
  -- Only moderator (and super_admin) manages catalogs.
  BEGIN PERFORM catalog.save_service('00000000-0000-4000-8000-0000000000c2', NULL, 'teste', 'Teste', '', 'hourly', 1000, NULL, true, 1);
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'FORBIDDEN' THEN RAISE EXCEPTION 'FAIL - finance does not manage catalogs (got %)', v_code; END IF;

  v_service := catalog.save_service('00000000-0000-4000-8000-0000000000c1', NULL, 'interpretacao-teste', 'Interpretação de teste', 'Desc', 'hourly', 9000, 'health', true, 5);
  IF NOT EXISTS (SELECT 1 FROM audit.events WHERE action = 'service.created' AND entity_id = v_service.id::text) THEN
    RAISE EXCEPTION 'FAIL - catalog changes are audited';
  END IF;
  -- Never used: the pricing mode may change and it may be deleted.
  PERFORM catalog.save_service('00000000-0000-4000-8000-0000000000c1', v_service.id, v_service.slug, v_service.title, '', 'fixed', 9000, NULL, true, 5);

  -- Used by an interpreter: R-CAT-01 and R-CAT-02.
  PERFORM identity.become_interpreter('00000000-0000-4000-8000-0000000000c3', NULL, NULL);
  INSERT INTO directory.interpreter_services (interpreter_id, service_id, price_aoa)
  VALUES ('00000000-0000-4000-8000-0000000000c3', v_service.id, 8000);
  v_code := NULL;
  BEGIN PERFORM catalog.save_service('00000000-0000-4000-8000-0000000000c1', v_service.id, v_service.slug, v_service.title, '', 'hourly', 9000, NULL, true, 5);
  EXCEPTION WHEN raise_exception THEN GET STACKED DIAGNOSTICS v_code = MESSAGE_TEXT, v_hint = PG_EXCEPTION_HINT; END;
  IF v_code IS DISTINCT FROM 'VALIDATION_FAILED' OR v_hint IS DISTINCT FROM 'pricing_mode:pricing_mode_locked' THEN
    RAISE EXCEPTION 'FAIL - the pricing mode of a used service does not change (got %, %)', v_code, v_hint;
  END IF;
  -- The price and the state still change (a new price applies to new quotes).
  PERFORM catalog.save_service('00000000-0000-4000-8000-0000000000c1', v_service.id, v_service.slug, v_service.title, '', 'fixed', 11000, NULL, false, 5);
  v_code := NULL;
  BEGIN PERFORM catalog.delete_item('00000000-0000-4000-8000-0000000000c1', 'service', v_service.id);
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'IN_USE' THEN RAISE EXCEPTION 'FAIL - a used service is not deleted (got %)', v_code; END IF;
  v_code := NULL;
  BEGIN DELETE FROM catalog.services WHERE id = v_service.id;
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'IN_USE' THEN RAISE EXCEPTION 'FAIL - not even directly (criterion 1)'; END IF;
  IF catalog.usage_count('service', v_service.id) <> 1 THEN RAISE EXCEPTION 'FAIL - usage counts the interpreter service'; END IF;
  RAISE NOTICE 'ok - a used service keeps its pricing mode and is deactivated, never deleted (R-CAT-01, R-CAT-02, criteria 1–2)';
END $$;

-- Review of H3 (AD-032): an update keeps what it is not given, the slug is fixed, the price is positive.
DO $$
DECLARE v_service catalog.services; v_after catalog.services; v_code text;
BEGIN
  v_service := catalog.save_service('00000000-0000-4000-8000-0000000000c1', NULL, 'servico-parcial', 'Serviço parcial', 'Desc', 'hourly', 9000, 'health', true, 5);
  -- Someone changes the price; another person then only deactivates it.
  PERFORM catalog.save_service('00000000-0000-4000-8000-0000000000c1', v_service.id, NULL, NULL, NULL, NULL, 14000, NULL, NULL, NULL);
  v_after := catalog.save_service('00000000-0000-4000-8000-0000000000c1', v_service.id, 'outro-slug', NULL, NULL, NULL, NULL, NULL, false, NULL);
  IF v_after.platform_price_aoa <> 14000 OR v_after.active OR v_after.icon IS DISTINCT FROM 'health' OR v_after.title <> 'Serviço parcial' THEN
    RAISE EXCEPTION 'FAIL - deactivating keeps the price and the rest (got %)', to_jsonb(v_after);
  END IF;
  IF v_after.slug <> 'servico-parcial' THEN RAISE EXCEPTION 'FAIL - the slug is fixed once the service exists'; END IF;
  v_after := catalog.save_service('00000000-0000-4000-8000-0000000000c1', v_service.id, NULL, NULL, NULL, NULL, NULL, '', NULL, NULL);
  IF v_after.icon IS NOT NULL THEN RAISE EXCEPTION 'FAIL - an empty icon clears it'; END IF;
  BEGIN PERFORM catalog.save_service('00000000-0000-4000-8000-0000000000c1', v_service.id, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL);
  EXCEPTION WHEN check_violation THEN GET STACKED DIAGNOSTICS v_code = CONSTRAINT_NAME; END;
  IF v_code IS DISTINCT FROM 'services_platform_price_aoa_check' THEN RAISE EXCEPTION 'FAIL - a price of 0 is refused (got %)', v_code; END IF;
  RAISE NOTICE 'ok - an update keeps what it is not given, the slug is fixed and the table price is positive (AD-032)';
END $$;

DO $$
DECLARE v_language catalog.languages; v_specialty catalog.specialties; v_code text;
BEGIN
  v_language := catalog.save_language('00000000-0000-4000-8000-0000000000c1', NULL, 'tst', 'Língua de teste', false, true, 1);
  v_specialty := catalog.save_specialty('00000000-0000-4000-8000-0000000000c1', NULL, 'especialidade-teste', 'Especialidade de teste', '', true, 1);
  INSERT INTO directory.interpreter_languages (interpreter_id, language_id, level)
  VALUES ('00000000-0000-4000-8000-0000000000c3', v_language.id, 'fluent');
  BEGIN PERFORM catalog.delete_item('00000000-0000-4000-8000-0000000000c1', 'language', v_language.id);
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'IN_USE' THEN RAISE EXCEPTION 'FAIL - a used language is not deleted (got %)', v_code; END IF;
  INSERT INTO directory.interpreter_specialties (interpreter_id, specialty_id)
  VALUES ('00000000-0000-4000-8000-0000000000c3', v_specialty.id);
  v_code := NULL;
  BEGIN PERFORM catalog.delete_item('00000000-0000-4000-8000-0000000000c1', 'specialty', v_specialty.id);
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'IN_USE' THEN RAISE EXCEPTION 'FAIL - a used specialty is not deleted (got %)', v_code; END IF;
  DELETE FROM directory.interpreter_specialties WHERE specialty_id = v_specialty.id;
  PERFORM catalog.delete_item('00000000-0000-4000-8000-0000000000c1', 'specialty', v_specialty.id);
  IF EXISTS (SELECT 1 FROM catalog.specialties WHERE id = v_specialty.id) THEN RAISE EXCEPTION 'FAIL - an unused item is deleted'; END IF;
  v_code := NULL;
  BEGIN PERFORM catalog.save_language('00000000-0000-4000-8000-0000000000c1', NULL, 'tst', 'Outra', false, true, 1);
  EXCEPTION WHEN unique_violation THEN v_code := 'unique'; END;
  IF v_code IS DISTINCT FROM 'unique' THEN RAISE EXCEPTION 'FAIL - language codes are unique'; END IF;
  RAISE NOTICE 'ok - languages and specialties: used ones are kept, unused ones deleted, codes unique (R-CAT-01)';
END $$;

-- Reads: visitors and accounts see active items only; the team sees all, with the usage.
UPDATE catalog.languages SET active = false WHERE code = 'tst';
SET LOCAL ROLE anon;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM catalog.services WHERE NOT active) OR EXISTS (SELECT 1 FROM catalog.languages WHERE NOT active)
     OR NOT EXISTS (SELECT 1 FROM catalog.services) THEN
    RAISE EXCEPTION 'FAIL - a visitor reads only active catalog items';
  END IF;
  RAISE NOTICE 'ok - a visitor reads only the active catalog (criterion 3 for /services)';
END $$;
RESET ROLE;
DO $$ BEGIN PERFORM set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-0000000000c1", "role": "authenticated"}', true); END $$;
SET LOCAL ROLE authenticated;
DO $$
DECLARE v_refused int := 0;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM catalog.service_admin WHERE NOT active AND used_in = 1)
     OR NOT EXISTS (SELECT 1 FROM catalog.language_admin WHERE code = 'tst' AND used_in = 1) THEN
    RAISE EXCEPTION 'FAIL - the team sees inactive items and where they are used';
  END IF;
  BEGIN UPDATE catalog.services SET platform_price_aoa = 1; EXCEPTION WHEN insufficient_privilege THEN v_refused := 1; END;
  IF v_refused <> 1 THEN RAISE EXCEPTION 'FAIL - catalogs are written only through the API'; END IF;
  RAISE NOTICE 'ok - the team reads every item with its usage, and writes only through the API';
END $$;
RESET ROLE;
