-- Staff, configuration versions, legal documents and verification document types (step H1;
-- staff-and-config.md). Every write is a SECURITY DEFINER function with EXECUTE for service_role,
-- called by the API with the caller's account from the JWT (p_actor), and records itself in the
-- audit trail in the same transaction (R-AUD-02).

-- Refuses unless p_actor is active staff with one of p_levels (super_admin always passes; an empty
-- list means any level). The R-STF-01 matrix for writes.
CREATE OR REPLACE FUNCTION identity.assert_staff(p_actor uuid, p_levels text[]) RETURNS text
  LANGUAGE plpgsql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_level text := auth_helper.staff_level_of(p_actor);
BEGIN
  IF v_level IS NULL OR NOT (v_level = 'super_admin' OR cardinality(p_levels) = 0 OR v_level = ANY (p_levels)) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'FORBIDDEN';
  END IF;
  RETURN v_level;
END;
$$;

-- Staff -------------------------------------------------------------------------------------------

-- R-STF-01, R-STF-02: only super_admin changes the team; the last active super_admin can be
-- neither demoted nor deactivated. A NULL level or active keeps the current value (PATCH), read
-- under the same lock as the change. All active super_admin rows are locked first, so two changes
-- at once cannot both remove "the other" super_admin.
CREATE OR REPLACE FUNCTION identity.set_staff_member(p_actor uuid, p_account uuid, p_level text, p_active boolean)
RETURNS identity.staff_members
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_before identity.staff_members;
  v_after identity.staff_members;
  v_supers integer;
  -- The actor's level before the change: a super_admin who steps down is still the one who acted.
  v_actor_level text := identity.assert_staff(p_actor, ARRAY['super_admin']);
BEGIN
  PERFORM 1 FROM identity.staff_members AS s WHERE s.active AND s.level = 'super_admin' FOR UPDATE;
  SELECT * INTO v_before FROM identity.staff_members AS s WHERE s.account_id = p_account FOR UPDATE;
  -- An active account is needed to join or to be reactivated; a suspended member can still be
  -- deactivated or have the level changed.
  IF v_before.account_id IS NULL AND p_level IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_FOUND';
  END IF;
  p_level := coalesce(p_level, v_before.level);
  p_active := coalesce(p_active, v_before.active, true);
  IF (v_before.account_id IS NULL OR p_active)
     AND NOT EXISTS (SELECT 1 FROM identity.profiles AS p WHERE p.id = p_account AND p.status = 'active') THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'ACCOUNT_NOT_FOUND';
  END IF;

  IF v_before.account_id IS NOT NULL AND v_before.active AND v_before.level = 'super_admin'
     AND (NOT p_active OR p_level <> 'super_admin') THEN
    SELECT count(*) INTO v_supers FROM identity.staff_members AS s WHERE s.active AND s.level = 'super_admin';
    IF v_supers <= 1 THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'LAST_SUPER_ADMIN';
    END IF;
  END IF;

  INSERT INTO identity.staff_members AS s (account_id, level, active, created_by)
  VALUES (p_account, p_level, p_active, p_actor)
  ON CONFLICT (account_id) DO UPDATE SET level = EXCLUDED.level, active = EXCLUDED.active
  RETURNING * INTO v_after;

  PERFORM audit.record(p_actor, v_actor_level,
    CASE WHEN v_before.account_id IS NULL THEN 'staff.added' ELSE 'staff.changed' END,
    'staff_member', p_account::text,
    CASE WHEN v_before.account_id IS NULL THEN NULL ELSE to_jsonb(v_before) END, to_jsonb(v_after));
  RETURN v_after;
END;
$$;

-- POST /admin/staff: the person must already have an account (exact email); ACCOUNT_NOT_FOUND
-- otherwise (staff-and-config.md, /team).
CREATE OR REPLACE FUNCTION identity.add_staff_member(p_actor uuid, p_email text, p_level text)
RETURNS identity.staff_members
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_account uuid;
BEGIN
  PERFORM identity.assert_staff(p_actor, ARRAY['super_admin']);
  SELECT u.id INTO v_account FROM auth.users AS u WHERE lower(u.email) = lower(trim(p_email));
  IF v_account IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'ACCOUNT_NOT_FOUND';
  END IF;
  RETURN identity.set_staff_member(p_actor, v_account, p_level, true);
END;
$$;

-- Configuration (R-CFG-01..04) ----------------------------------------------------------------------

-- The value columns of a version: everything but the bookkeeping columns.
CREATE OR REPLACE FUNCTION config.value_columns() RETURNS text[]
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$
  SELECT array_agg(a.attname::text ORDER BY a.attnum)
    FROM pg_catalog.pg_attribute AS a
   WHERE a.attrelid = 'config.platform_versions'::regclass AND a.attnum > 0 AND NOT a.attisdropped
     AND a.attname NOT IN ('id', 'version_number', 'status', 'published_at', 'published_by', 'notes',
                           'created_by', 'created_at', 'updated_at')
$$;

-- R-CFG-03: the version in force now; what a request, an intent or a verification stores.
CREATE OR REPLACE FUNCTION config.current_version_id() RETURNS uuid
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$ SELECT v.id FROM config.platform_versions AS v WHERE v.status = 'published' $$;

CREATE OR REPLACE FUNCTION config.get(p_version uuid) RETURNS config.platform_versions
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$ SELECT v.* FROM config.platform_versions AS v WHERE v.id = p_version $$;

-- R-CFG-04: an empty value refuses the operation; never a hidden default.
CREATE OR REPLACE FUNCTION config.require(p_version uuid, p_field text) RETURNS text
  LANGUAGE plpgsql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_value text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM config.platform_versions AS v WHERE v.id = p_version) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_FOUND';
  END IF;
  IF NOT p_field = ANY (config.value_columns()) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INTERNAL_ERROR',
      DETAIL = format('%L is not a configuration value', p_field);
  END IF;
  EXECUTE format('SELECT (v.%I)::text FROM config.platform_versions AS v WHERE v.id = $1', p_field)
    INTO v_value USING p_version;
  IF v_value IS NULL OR v_value = '' THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'CONFIG_VALUE_MISSING',
      DETAIL = format('configuration field %s is empty in version %s', p_field, p_version);
  END IF;
  RETURN v_value;
END;
$$;

-- R-CFG-02: a draft copied from a version (by default the one in force).
CREATE OR REPLACE FUNCTION config.create_draft(p_actor uuid, p_from uuid DEFAULT NULL)
RETURNS config.platform_versions
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_source uuid := coalesce(p_from, config.current_version_id());
  v_columns text;
  v_id uuid := gen_random_uuid();
  v_row config.platform_versions;
BEGIN
  PERFORM identity.assert_staff(p_actor, ARRAY['super_admin']);
  IF NOT EXISTS (SELECT 1 FROM config.platform_versions AS v WHERE v.id = v_source) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_FOUND';
  END IF;
  -- Version numbers are taken one at a time.
  LOCK TABLE config.platform_versions IN SHARE ROW EXCLUSIVE MODE;
  SELECT string_agg(format('%I', c), ', ') INTO v_columns FROM unnest(config.value_columns()) AS c;
  EXECUTE format(
    'INSERT INTO config.platform_versions (id, version_number, status, created_by, %1$s)
     SELECT $1, (SELECT coalesce(max(version_number), 0) + 1 FROM config.platform_versions), ''draft'', $2, %1$s
       FROM config.platform_versions WHERE id = $3', v_columns)
    USING v_id, p_actor, v_source;
  SELECT * INTO v_row FROM config.platform_versions AS v WHERE v.id = v_id;
  PERFORM audit.record(p_actor, 'super_admin', 'config.draft_created', 'platform_version', v_id::text,
    NULL, jsonb_build_object('version_number', v_row.version_number, 'from', v_source));
  RETURN v_row;
END;
$$;

-- R-CFG-02: only a draft is edited; unknown fields are refused. p_values: {"field": value|null}.
CREATE OR REPLACE FUNCTION config.update_draft(p_actor uuid, p_id uuid, p_values jsonb, p_notes text DEFAULT NULL)
RETURNS config.platform_versions
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_before config.platform_versions;
  v_after config.platform_versions;
  v_key text;
  v_sets text[] := '{}';
BEGIN
  PERFORM identity.assert_staff(p_actor, ARRAY['super_admin']);
  SELECT * INTO v_before FROM config.platform_versions AS v WHERE v.id = p_id FOR UPDATE;
  IF v_before.id IS NULL THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_FOUND'; END IF;
  IF v_before.status <> 'draft' THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'STATE_CHANGED'; END IF;
  IF jsonb_typeof(p_values) <> 'object' THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'VALIDATION_FAILED'; END IF;
  FOR v_key IN SELECT jsonb_object_keys(p_values) LOOP
    IF NOT v_key = ANY (config.value_columns()) THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'VALIDATION_FAILED', DETAIL = format('unknown field %L', v_key);
    END IF;
    v_sets := v_sets || format('%1$I = (jsonb_populate_record(NULL::config.platform_versions, $1)).%1$I', v_key);
  END LOOP;
  IF cardinality(v_sets) > 0 THEN
    EXECUTE format('UPDATE config.platform_versions SET %s WHERE id = $2', array_to_string(v_sets, ', '))
      USING p_values, p_id;
  END IF;
  IF p_notes IS NOT NULL THEN
    UPDATE config.platform_versions SET notes = p_notes WHERE id = p_id;
  END IF;
  SELECT * INTO v_after FROM config.platform_versions AS v WHERE v.id = p_id;
  PERFORM audit.record(p_actor, 'super_admin', 'config.draft_updated', 'platform_version', p_id::text,
    config.changed_fields(to_jsonb(v_after), to_jsonb(v_before)), config.changed_fields(to_jsonb(v_before), to_jsonb(v_after)));
  RETURN v_after;
END;
$$;

-- The fields of p_to that differ from p_from (values from p_to), bookkeeping columns left out.
CREATE OR REPLACE FUNCTION config.changed_fields(p_from jsonb, p_to jsonb) RETURNS jsonb
  LANGUAGE sql IMMUTABLE
  SET search_path = ''
AS $$
  SELECT coalesce(jsonb_object_agg(t.key, t.value), '{}')
    FROM jsonb_each(p_to) AS t
   WHERE t.key NOT IN ('id', 'version_number', 'status', 'published_at', 'published_by', 'created_by', 'created_at', 'updated_at')
     AND t.value IS DISTINCT FROM (p_from -> t.key)
$$;

-- R-CFG-01, R-CFG-02: publish a draft; the version in force becomes retired in the same
-- transaction. p_expected_current is the version the screen showed (STATE_CHANGED if it is no
-- longer in force; NULL only when nothing is published yet). The audit keeps, for every changed
-- field, the value before and after.
CREATE OR REPLACE FUNCTION config.publish_version(p_actor uuid, p_id uuid, p_expected_current uuid)
RETURNS config.platform_versions
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_current config.platform_versions;
  v_draft config.platform_versions;
  v_after config.platform_versions;
BEGIN
  PERFORM identity.assert_staff(p_actor, ARRAY['super_admin']);
  -- One publish at a time: the second waits here and then sees the new version in force.
  LOCK TABLE config.platform_versions IN SHARE ROW EXCLUSIVE MODE;
  SELECT * INTO v_current FROM config.platform_versions AS v WHERE v.status = 'published';
  IF v_current.id IS DISTINCT FROM p_expected_current THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'STATE_CHANGED';
  END IF;
  SELECT * INTO v_draft FROM config.platform_versions AS v WHERE v.id = p_id;
  IF v_draft.id IS NULL THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_FOUND'; END IF;
  IF v_draft.status <> 'draft' THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'STATE_CHANGED'; END IF;

  IF v_current.id IS NOT NULL THEN
    UPDATE config.platform_versions SET status = 'retired' WHERE id = v_current.id;
  END IF;
  UPDATE config.platform_versions
     SET status = 'published', published_at = util.now(), published_by = p_actor
   WHERE id = p_id
  RETURNING * INTO v_after;

  PERFORM audit.record(p_actor, 'super_admin', 'config.published', 'platform_version', p_id::text,
    CASE WHEN v_current.id IS NULL THEN NULL
         ELSE config.changed_fields(to_jsonb(v_after), to_jsonb(v_current)) || jsonb_build_object('version_number', v_current.version_number) END,
    config.changed_fields(coalesce(to_jsonb(v_current), '{}'), to_jsonb(v_after)) || jsonb_build_object('version_number', v_after.version_number));
  RETURN v_after;
END;
$$;

-- Legal documents (D-55, PC-05) ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION identity.create_legal_draft(p_actor uuid, p_kind text, p_body text)
RETURNS identity.legal_documents
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_row identity.legal_documents;
BEGIN
  PERFORM identity.assert_staff(p_actor, ARRAY['super_admin']);
  LOCK TABLE identity.legal_documents IN SHARE ROW EXCLUSIVE MODE;
  INSERT INTO identity.legal_documents (kind, version, body, created_by)
  VALUES (p_kind, (SELECT coalesce(max(d.version), 0) + 1 FROM identity.legal_documents AS d WHERE d.kind = p_kind),
          coalesce(p_body, ''), p_actor)
  RETURNING * INTO v_row;
  PERFORM audit.record(p_actor, 'super_admin', 'legal.draft_created', 'legal_document', v_row.id::text,
    NULL, jsonb_build_object('kind', v_row.kind, 'version', v_row.version));
  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION identity.update_legal_draft(p_actor uuid, p_id uuid, p_body text)
RETURNS identity.legal_documents
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_before identity.legal_documents;
  v_after identity.legal_documents;
BEGIN
  PERFORM identity.assert_staff(p_actor, ARRAY['super_admin']);
  SELECT * INTO v_before FROM identity.legal_documents AS d WHERE d.id = p_id FOR UPDATE;
  IF v_before.id IS NULL THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_FOUND'; END IF;
  IF v_before.published_at IS NOT NULL THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'STATE_CHANGED'; END IF;
  UPDATE identity.legal_documents SET body = coalesce(p_body, '') WHERE id = p_id RETURNING * INTO v_after;
  PERFORM audit.record(p_actor, 'super_admin', 'legal.draft_updated', 'legal_document', p_id::text,
    jsonb_build_object('body_length', length(v_before.body)), jsonb_build_object('body_length', length(v_after.body)));
  RETURN v_after;
END;
$$;

-- Publishing makes the version the one every account must accept (R-PRIV-02).
CREATE OR REPLACE FUNCTION identity.publish_legal_document(p_actor uuid, p_id uuid)
RETURNS identity.legal_documents
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_row identity.legal_documents;
BEGIN
  PERFORM identity.assert_staff(p_actor, ARRAY['super_admin']);
  SELECT * INTO v_row FROM identity.legal_documents AS d WHERE d.id = p_id FOR UPDATE;
  IF v_row.id IS NULL THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_FOUND'; END IF;
  IF v_row.published_at IS NOT NULL THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'STATE_CHANGED'; END IF;
  -- An older draft cannot become the version in force over a newer published one.
  IF EXISTS (SELECT 1 FROM identity.legal_documents AS d
              WHERE d.kind = v_row.kind AND d.published_at IS NOT NULL AND d.version > v_row.version) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'STATE_CHANGED';
  END IF;
  UPDATE identity.legal_documents SET published_at = util.now(), published_by = p_actor
   WHERE id = p_id RETURNING * INTO v_row;
  PERFORM audit.record(p_actor, 'super_admin', 'legal.published', 'legal_document', p_id::text,
    NULL, jsonb_build_object('kind', v_row.kind, 'version', v_row.version));
  -- A new version (not the first) is announced to every active account (R-PRIV-02, terms_updated).
  IF EXISTS (SELECT 1 FROM identity.legal_documents AS d
              WHERE d.kind = v_row.kind AND d.published_at IS NOT NULL AND d.id <> v_row.id) THEN
    -- The link opens the app the person uses: the last active role, else the team's, else requester-web.
    PERFORM notify.enqueue('terms_updated', p.id,
              jsonb_build_object('kind', v_row.kind, 'version', v_row.version, 'link', '/accept-terms',
                'app', coalesce(p.last_active_role,
                                CASE WHEN auth_helper.staff_level_of(p.id) IS NOT NULL THEN 'admin' END,
                                CASE WHEN auth_helper.is_interpreter_account(p.id) THEN 'interpreter' END,
                                'requester')))
       FROM identity.profiles AS p WHERE p.status = 'active';
  END IF;
  RETURN v_row;
END;
$$;

-- Verification document types (PC-07, R-VER-02): moderator and super_admin ----------------------

CREATE OR REPLACE FUNCTION config.save_document_type(
  p_actor uuid, p_id uuid, p_code text, p_name text, p_description text, p_required boolean, p_active boolean, p_sort integer
) RETURNS config.verification_document_types
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_level text := identity.assert_staff(p_actor, ARRAY['moderator']);
  v_before config.verification_document_types;
  v_after config.verification_document_types;
BEGIN
  IF p_id IS NULL THEN
    INSERT INTO config.verification_document_types (code, name, description, required, active, sort)
    VALUES (p_code, p_name, coalesce(p_description, ''), p_required, p_active, p_sort)
    RETURNING * INTO v_after;
  ELSE
    SELECT * INTO v_before FROM config.verification_document_types AS t WHERE t.id = p_id FOR UPDATE;
    IF v_before.id IS NULL THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_FOUND'; END IF;
    UPDATE config.verification_document_types
       SET code = p_code, name = p_name, description = coalesce(p_description, ''),
           required = p_required, active = p_active, sort = p_sort
     WHERE id = p_id RETURNING * INTO v_after;
  END IF;
  PERFORM audit.record(p_actor, v_level, CASE WHEN p_id IS NULL THEN 'document_type.created' ELSE 'document_type.updated' END,
    'document_type', v_after.id::text, CASE WHEN v_before.id IS NULL THEN NULL ELSE to_jsonb(v_before) END, to_jsonb(v_after));
  RETURN v_after;
END;
$$;

-- Removing a type that documents already use is refused with IN_USE (catalogs.md) once
-- verification documents exist (H12 extends the check); until then nothing references it.
CREATE OR REPLACE FUNCTION config.delete_document_type(p_actor uuid, p_id uuid) RETURNS void
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_level text := identity.assert_staff(p_actor, ARRAY['moderator']);
  v_before config.verification_document_types;
BEGIN
  DELETE FROM config.verification_document_types AS t WHERE t.id = p_id RETURNING * INTO v_before;
  IF v_before.id IS NULL THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_FOUND'; END IF;
  PERFORM audit.record(p_actor, v_level, 'document_type.deleted', 'document_type', p_id::text, to_jsonb(v_before), NULL);
END;
$$;
