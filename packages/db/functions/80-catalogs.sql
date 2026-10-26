-- Catalogs (step H3; catalogs.md, R-CAT-01, R-CAT-02). Writes by the API, moderator and
-- super_admin; every change audited.

-- How many rows use each catalog item: the one place "used" is defined (R-CAT-01). Each step that
-- references a catalog adds its table here (requests H5, opportunities H17).
CREATE OR REPLACE VIEW catalog.item_usage AS
SELECT 'language'::text AS kind, l.language_id AS id, count(*)::integer AS used
  FROM directory.interpreter_languages AS l GROUP BY l.language_id
UNION ALL
SELECT 'specialty', s.specialty_id, count(*)::integer
  FROM directory.interpreter_specialties AS s GROUP BY s.specialty_id
UNION ALL
SELECT 'service', s.service_id, count(*)::integer
  FROM directory.interpreter_services AS s GROUP BY s.service_id;

CREATE OR REPLACE FUNCTION catalog.usage_count(p_kind text, p_id uuid) RETURNS integer
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$ SELECT coalesce(sum(u.used), 0)::integer FROM catalog.item_usage AS u WHERE u.kind = p_kind AND u.id = p_id $$;

CREATE OR REPLACE FUNCTION catalog.save_language(
  p_actor uuid, p_id uuid, p_code text, p_name text, p_is_sign_language boolean, p_active boolean, p_sort integer
) RETURNS catalog.languages
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_level text := identity.assert_staff(p_actor, ARRAY['moderator']);
  v_before catalog.languages;
  v_after catalog.languages;
BEGIN
  IF p_id IS NULL THEN
    INSERT INTO catalog.languages (code, name, is_sign_language, active, sort)
    VALUES (lower(trim(p_code)), trim(p_name), p_is_sign_language, p_active, p_sort)
    RETURNING * INTO v_after;
  ELSE
    SELECT * INTO v_before FROM catalog.languages AS l WHERE l.id = p_id FOR UPDATE;
    IF v_before.id IS NULL THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_FOUND'; END IF;
    UPDATE catalog.languages
       SET code = lower(trim(p_code)), name = trim(p_name), is_sign_language = p_is_sign_language, active = p_active, sort = p_sort
     WHERE id = p_id RETURNING * INTO v_after;
  END IF;
  PERFORM audit.record(p_actor, v_level, CASE WHEN p_id IS NULL THEN 'language.created' ELSE 'language.updated' END,
    'language', v_after.id::text, CASE WHEN v_before.id IS NULL THEN NULL ELSE to_jsonb(v_before) END, to_jsonb(v_after));
  RETURN v_after;
END;
$$;

CREATE OR REPLACE FUNCTION catalog.save_specialty(
  p_actor uuid, p_id uuid, p_slug text, p_name text, p_description text, p_active boolean, p_sort integer
) RETURNS catalog.specialties
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_level text := identity.assert_staff(p_actor, ARRAY['moderator']);
  v_before catalog.specialties;
  v_after catalog.specialties;
BEGIN
  IF p_id IS NULL THEN
    INSERT INTO catalog.specialties (slug, name, description, active, sort)
    VALUES (trim(p_slug), trim(p_name), coalesce(p_description, ''), p_active, p_sort)
    RETURNING * INTO v_after;
  ELSE
    SELECT * INTO v_before FROM catalog.specialties AS s WHERE s.id = p_id FOR UPDATE;
    IF v_before.id IS NULL THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_FOUND'; END IF;
    UPDATE catalog.specialties
       SET slug = trim(p_slug), name = trim(p_name), description = coalesce(p_description, ''), active = p_active, sort = p_sort
     WHERE id = p_id RETURNING * INTO v_after;
  END IF;
  PERFORM audit.record(p_actor, v_level, CASE WHEN p_id IS NULL THEN 'specialty.created' ELSE 'specialty.updated' END,
    'specialty', v_after.id::text, CASE WHEN v_before.id IS NULL THEN NULL ELSE to_jsonb(v_before) END, to_jsonb(v_after));
  RETURN v_after;
END;
$$;

-- A new table price applies to new quotes only: managed requests keep their own unit price.
CREATE OR REPLACE FUNCTION catalog.save_service(
  p_actor uuid, p_id uuid, p_slug text, p_title text, p_description text, p_pricing_mode text,
  p_platform_price_aoa bigint, p_icon text, p_active boolean, p_sort integer
) RETURNS catalog.services
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_level text := identity.assert_staff(p_actor, ARRAY['moderator']);
  v_before catalog.services;
  v_after catalog.services;
BEGIN
  IF p_id IS NULL THEN
    INSERT INTO catalog.services (slug, title, description, pricing_mode, platform_price_aoa, icon, active, sort)
    VALUES (trim(p_slug), trim(p_title), coalesce(p_description, ''), p_pricing_mode, p_platform_price_aoa,
            nullif(trim(p_icon), ''), p_active, p_sort)
    RETURNING * INTO v_after;
  ELSE
    SELECT * INTO v_before FROM catalog.services AS s WHERE s.id = p_id FOR UPDATE;
    IF v_before.id IS NULL THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_FOUND'; END IF;
    UPDATE catalog.services
       SET slug = trim(p_slug), title = trim(p_title), description = coalesce(p_description, ''),
           pricing_mode = p_pricing_mode, platform_price_aoa = p_platform_price_aoa, icon = nullif(trim(p_icon), ''),
           active = p_active, sort = p_sort
     WHERE id = p_id RETURNING * INTO v_after;
  END IF;
  PERFORM audit.record(p_actor, v_level, CASE WHEN p_id IS NULL THEN 'service.created' ELSE 'service.updated' END,
    'service', v_after.id::text, CASE WHEN v_before.id IS NULL THEN NULL ELSE to_jsonb(v_before) END, to_jsonb(v_after));
  RETURN v_after;
END;
$$;

-- Only an item never used is deleted (the BEFORE DELETE guard refuses with IN_USE).
CREATE OR REPLACE FUNCTION catalog.delete_item(p_actor uuid, p_kind text, p_id uuid) RETURNS void
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_level text := identity.assert_staff(p_actor, ARRAY['moderator']);
  v_before jsonb;
BEGIN
  CASE p_kind
    WHEN 'language' THEN DELETE FROM catalog.languages AS l WHERE l.id = p_id RETURNING to_jsonb(l) INTO v_before;
    WHEN 'specialty' THEN DELETE FROM catalog.specialties AS s WHERE s.id = p_id RETURNING to_jsonb(s) INTO v_before;
    WHEN 'service' THEN DELETE FROM catalog.services AS s WHERE s.id = p_id RETURNING to_jsonb(s) INTO v_before;
    ELSE RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_FOUND';
  END CASE;
  IF v_before IS NULL THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_FOUND'; END IF;
  PERFORM audit.record(p_actor, v_level, p_kind || '.deleted', p_kind, p_id::text, v_before, NULL);
END;
$$;
