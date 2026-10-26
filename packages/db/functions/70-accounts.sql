-- Accounts, roles, organisations, invites, suspension and consent (step H2;
-- accounts-and-organizations.md, personal-data.md R-PRIV-01/02/03). Every function is
-- SECURITY DEFINER with EXECUTE for service_role only: the API calls them with the account from the
-- JWT as p_actor (api.md §1). Rule refusals raise P0001 with the catalog code (data-model.md §0).

-- Helpers --------------------------------------------------------------------------------------------

-- The roles an account has (R-ACC-02): requester (individual profile or active membership),
-- interpreter, staff.
CREATE OR REPLACE FUNCTION identity.roles_of(p_account uuid) RETURNS text[]
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$
  SELECT array_remove(ARRAY[
    CASE WHEN EXISTS (SELECT 1 FROM identity.requester_profiles AS r WHERE r.account_id = p_account)
           OR EXISTS (SELECT 1 FROM identity.organization_members AS m
                       WHERE m.account_id = p_account AND m.status = 'active')
         THEN 'requester' END,
    CASE WHEN EXISTS (SELECT 1 FROM identity.interpreter_profiles AS i WHERE i.account_id = p_account)
         THEN 'interpreter' END,
    CASE WHEN auth_helper.staff_level_of(p_account) IS NOT NULL THEN 'staff' END
  ], NULL)
$$;

-- The active role of an account in an organisation, or NULL.
CREATE OR REPLACE FUNCTION identity.member_role(p_org uuid, p_account uuid) RETURNS text
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$
  SELECT m.role FROM identity.organization_members AS m
   WHERE m.organization_id = p_org AND m.account_id = p_account AND m.status = 'active'
$$;

-- Refuses unless the actor is an active member with one of the roles (R-ORG-05). Returns the role.
CREATE OR REPLACE FUNCTION identity.assert_org_role(p_org uuid, p_actor uuid, p_roles text[]) RETURNS text
  LANGUAGE plpgsql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_role text := identity.member_role(p_org, p_actor);
BEGIN
  IF v_role IS NULL OR NOT v_role = ANY (p_roles) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'FORBIDDEN';
  END IF;
  RETURN v_role;
END;
$$;

-- "Maria João Gonçalves" → "maria-joao-goncalves" (R-DIR-02).
CREATE OR REPLACE FUNCTION identity.slugify(p_text text) RETURNS text
  LANGUAGE sql IMMUTABLE
  SET search_path = ''
AS $$
  SELECT coalesce(nullif(left(trim(BOTH '-' FROM regexp_replace(
           translate(lower(coalesce(p_text, '')), 'áàâãäéèêëíìîïóòôõöúùûüçñ', 'aaaaaeeeeiiiiooooouuuucn'),
           '[^a-z0-9]+', '-', 'g')), 60), ''), 'interprete')
$$;

-- "joana.silva@empresa.ao" → "jo***@empresa.ao": an invite page shown to the wrong session must not
-- give the whole address away (accounts-and-organizations.md, casos-limite).
CREATE OR REPLACE FUNCTION identity.mask_email(p_email text) RETURNS text
  LANGUAGE sql IMMUTABLE
  SET search_path = ''
AS $$
  SELECT left(split_part(p_email, '@', 1), 2) || '***@' || split_part(p_email, '@', 2)
$$;

CREATE OR REPLACE FUNCTION identity.hash_token(p_token text) RETURNS text
  LANGUAGE sql IMMUTABLE
  SET search_path = ''
AS $$ SELECT encode(extensions.digest(convert_to(p_token, 'UTF8'), 'sha256'), 'hex') $$;

-- GET /me (api.md §4; R-ACC-02, R-ACC-04, R-PRIV-02) ----------------------------------------------
CREATE OR REPLACE FUNCTION identity.me(p_account uuid) RETURNS jsonb
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$
  SELECT jsonb_build_object(
    'account', jsonb_build_object('id', p.id, 'email', u.email, 'full_name', p.full_name, 'phone', p.phone,
                                  'avatar_path', p.avatar_path, 'status', p.status),
    'roles', to_jsonb(identity.roles_of(p.id)),
    'staff_level', auth_helper.staff_level_of(p.id),
    'organizations', coalesce((
      SELECT jsonb_agg(jsonb_build_object('id', o.id, 'name', o.name, 'role', m.role, 'status', o.status)
                       ORDER BY o.name)
        FROM identity.organization_members AS m
        JOIN identity.organizations AS o ON o.id = m.organization_id
       WHERE m.account_id = p.id AND m.status = 'active' AND o.status <> 'anonymized'), '[]'::jsonb),
    'last_active_role', p.last_active_role,
    -- What the person chose at sign-up; only decides where onboarding leads (R-ACC-01).
    'intended_role', CASE WHEN u.raw_user_meta_data ->> 'intended_role' IN ('requester', 'interpreter', 'organization')
                          THEN u.raw_user_meta_data ->> 'intended_role' END,
    'terms_acceptance_required', EXISTS (SELECT 1 FROM auth_helper.pending_legal_documents(p.id)),
    'pending_documents', coalesce((
      SELECT jsonb_agg(jsonb_build_object('id', d.id, 'kind', d.kind, 'version', d.version) ORDER BY d.kind)
        FROM auth_helper.pending_legal_documents(p.id) AS d), '[]'::jsonb))
    FROM identity.profiles AS p
    JOIN auth.users AS u ON u.id = p.id
   WHERE p.id = p_account
$$;

-- Consent (R-PRIV-01, R-PRIV-02) -----------------------------------------------------------------

-- The documents a person accepts must be published, and cover every kind that has a published
-- version (the terms and the privacy policy shown at sign-up, R-PRIV-01).
CREATE OR REPLACE FUNCTION identity.assert_acceptable_documents(p_document_ids uuid[]) RETURNS void
  LANGUAGE plpgsql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM unnest(coalesce(p_document_ids, '{}')) AS ids(id)
              WHERE NOT EXISTS (SELECT 1 FROM identity.legal_documents AS d
                                 WHERE d.id = ids.id AND d.published_at IS NOT NULL))
     OR EXISTS (SELECT 1 FROM identity.legal_documents AS d
                 WHERE d.published_at IS NOT NULL
                   AND NOT EXISTS (SELECT 1 FROM identity.legal_documents AS chosen
                                    WHERE chosen.id = ANY (coalesce(p_document_ids, '{}')) AND chosen.kind = d.kind)) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'VALIDATION_FAILED', HINT = 'legal_document_ids:invalid';
  END IF;
END;
$$;

-- An account already uses this email (EMAIL_IN_USE at sign-up, accounts-and-organizations.md).
CREATE OR REPLACE FUNCTION identity.email_in_use(p_email text) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$ SELECT EXISTS (SELECT 1 FROM auth.users AS u WHERE lower(u.email) = lower(trim(p_email))) $$;

-- Records the acceptance of published legal documents, with date, IP and agent. A document that
-- is not published is a bad request. Returns how many documents the account still has to accept.
CREATE OR REPLACE FUNCTION identity.record_consents(p_account uuid, p_document_ids uuid[], p_ip text, p_user_agent text)
RETURNS integer
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
BEGIN
  IF cardinality(coalesce(p_document_ids, '{}')) = 0
     OR EXISTS (SELECT 1 FROM unnest(p_document_ids) AS ids(id)
                 WHERE NOT EXISTS (SELECT 1 FROM identity.legal_documents AS d
                                    WHERE d.id = ids.id AND d.published_at IS NOT NULL)) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'VALIDATION_FAILED', HINT = 'legal_document_ids:invalid';
  END IF;
  INSERT INTO identity.consents (account_id, legal_document_id, accepted_at, ip, user_agent)
  SELECT p_account, ids.id, util.now(), p_ip, left(p_user_agent, 500)
    FROM (SELECT DISTINCT unnest(p_document_ids) AS id) AS ids
  ON CONFLICT (account_id, legal_document_id) DO NOTHING;
  RETURN (SELECT count(*) FROM auth_helper.pending_legal_documents(p_account));
END;
$$;

-- Roles (R-ACC-01, R-ACC-04) ----------------------------------------------------------------------

CREATE OR REPLACE FUNCTION identity.become_requester(p_actor uuid, p_nif text, p_address text, p_city text)
RETURNS identity.requester_profiles
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_row identity.requester_profiles;
BEGIN
  INSERT INTO identity.requester_profiles (account_id, nif, address, city)
  VALUES (p_actor, nullif(trim(p_nif), ''), nullif(trim(p_address), ''), nullif(trim(p_city), ''))
  ON CONFLICT (account_id) DO NOTHING
  RETURNING * INTO v_row;
  IF v_row.account_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'ROLE_ALREADY_EXISTS';
  END IF;
  UPDATE identity.profiles SET last_active_role = 'requester' WHERE id = p_actor;
  RETURN v_row;
END;
$$;

-- The slug comes from the name, with -2, -3… when taken (R-DIR-02).
CREATE OR REPLACE FUNCTION identity.become_interpreter(p_actor uuid, p_bio text, p_city text)
RETURNS identity.interpreter_profiles
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_base text;
  v_slug text;
  v_try integer := 1;
  v_row identity.interpreter_profiles;
BEGIN
  IF EXISTS (SELECT 1 FROM identity.interpreter_profiles AS i WHERE i.account_id = p_actor) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'ROLE_ALREADY_EXISTS';
  END IF;
  SELECT identity.slugify(p.full_name) INTO v_base FROM identity.profiles AS p WHERE p.id = p_actor;
  LOOP
    v_slug := CASE WHEN v_try = 1 THEN v_base ELSE v_base || '-' || v_try END;
    BEGIN
      INSERT INTO identity.interpreter_profiles (account_id, slug, bio, city)
      VALUES (p_actor, v_slug, nullif(trim(p_bio), ''), nullif(trim(p_city), ''))
      RETURNING * INTO v_row;
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      -- The same account twice (two clicks at once) is the role that already exists.
      IF EXISTS (SELECT 1 FROM identity.interpreter_profiles AS i WHERE i.account_id = p_actor) THEN
        RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'ROLE_ALREADY_EXISTS';
      END IF;
      v_try := v_try + 1;
    END;
  END LOOP;
  UPDATE identity.profiles SET last_active_role = 'interpreter' WHERE id = p_actor;
  RETURN v_row;
END;
$$;

-- R-ACC-04: the app the person goes to next; only a role the account has.
CREATE OR REPLACE FUNCTION identity.set_active_role(p_actor uuid, p_role text) RETURNS text
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
BEGIN
  IF p_role NOT IN ('requester', 'interpreter') OR NOT p_role = ANY (identity.roles_of(p_actor)) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'FORBIDDEN';
  END IF;
  UPDATE identity.profiles SET last_active_role = p_role WHERE id = p_actor;
  RETURN p_role;
END;
$$;

-- Organisations (R-ORG-01..04) --------------------------------------------------------------------

CREATE OR REPLACE FUNCTION identity.create_organization(
  p_actor uuid, p_name text, p_nif text, p_sector text, p_address text, p_city text, p_phone text, p_website_url text
) RETURNS identity.organizations
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_org identity.organizations;
BEGIN
  INSERT INTO identity.organizations (name, nif, sector, address, city, phone, website_url, created_by)
  VALUES (trim(p_name), upper(trim(p_nif)), nullif(trim(p_sector), ''), nullif(trim(p_address), ''),
          nullif(trim(p_city), ''), nullif(trim(p_phone), ''), nullif(trim(p_website_url), ''), p_actor)
  RETURNING * INTO v_org;
  INSERT INTO identity.organization_members (organization_id, account_id, role, joined_at)
  VALUES (v_org.id, p_actor, 'owner', util.now());
  -- Creating an organisation gives the requester role in its context (R-ORG-01).
  UPDATE identity.profiles SET last_active_role = 'requester' WHERE id = p_actor;
  PERFORM audit.record(p_actor, 'account', 'organization.created', 'organization', v_org.id::text, NULL,
    jsonb_build_object('name', v_org.name, 'nif', v_org.nif));
  RETURN v_org;
END;
$$;

-- R-ORG-02: owner or admin invites by email. The token is returned once (it goes in the email);
-- only its hash is kept. A pending invite to the same email is replaced by the new one.
CREATE OR REPLACE FUNCTION identity.create_invite(p_actor uuid, p_org uuid, p_email text, p_role text)
RETURNS jsonb
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_org identity.organizations;
  v_version uuid := config.current_version_id();
  v_days integer;
  v_token text := rtrim(translate(encode(extensions.gen_random_bytes(32), 'base64'), '+/', '-_'), '=');
  v_invite identity.organization_invites;
  v_email text := lower(trim(p_email));
BEGIN
  SELECT * INTO v_org FROM identity.organizations AS o WHERE o.id = p_org FOR UPDATE;
  IF v_org.id IS NULL THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_FOUND'; END IF;
  PERFORM identity.assert_org_role(p_org, p_actor, ARRAY['owner', 'admin']);
  IF v_org.status <> 'active' THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'FORBIDDEN'; END IF;
  IF p_role NOT IN ('admin', 'member') THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'VALIDATION_FAILED', HINT = 'role:invalid';
  END IF;
  IF EXISTS (SELECT 1 FROM identity.organization_members AS m
               JOIN auth.users AS u ON u.id = m.account_id
              WHERE m.organization_id = p_org AND m.status = 'active' AND lower(u.email) = v_email) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'VALIDATION_FAILED', HINT = 'email:already_member';
  END IF;
  IF v_version IS NULL THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'CONFIG_VALUE_MISSING'; END IF;
  v_days := config.require(v_version, 'org_invite_expiry_days')::integer;

  UPDATE identity.organization_invites
     SET status = 'revoked', decided_at = util.now()
   WHERE organization_id = p_org AND email = v_email AND status = 'pending';
  INSERT INTO identity.organization_invites (organization_id, email, role, token_hash, invited_by, expires_at)
  VALUES (p_org, v_email, p_role, identity.hash_token(v_token), p_actor, util.now() + make_interval(days => v_days))
  RETURNING * INTO v_invite;

  PERFORM notify.enqueue_email('org_invite', v_email, jsonb_build_object(
    'organization_name', v_org.name, 'role', p_role,
    'invited_by_name', (SELECT p.full_name FROM identity.profiles AS p WHERE p.id = p_actor),
    'expires_at', v_invite.expires_at, 'link', '/invite/' || v_token, 'app', 'requester'));
  PERFORM audit.record(p_actor, 'account', 'organization.invite_created', 'organization', p_org::text, NULL,
    jsonb_build_object('invite_id', v_invite.id, 'email', v_email, 'role', p_role));
  RETURN jsonb_build_object('invite', to_jsonb(v_invite) - 'token_hash', 'token', v_token);
END;
$$;

-- What /invite/:token shows before accepting: organisation, role, masked email, state. NULL for an
-- unknown token.
CREATE OR REPLACE FUNCTION identity.invite_preview(p_token text) RETURNS jsonb
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$
  SELECT jsonb_build_object(
    'organization_name', o.name, 'role', i.role, 'email_masked', identity.mask_email(i.email::text),
    'status', CASE WHEN i.status = 'pending' AND i.expires_at <= util.now() THEN 'expired' ELSE i.status END,
    'expires_at', i.expires_at)
    FROM identity.organization_invites AS i
    JOIN identity.organizations AS o ON o.id = i.organization_id
   WHERE i.token_hash = identity.hash_token(p_token)
$$;

-- R-ORG-02: only the account with exactly the invited email accepts; accepting is final. The invite
-- row is locked, so two accepts give one membership.
CREATE OR REPLACE FUNCTION identity.accept_invite(p_actor uuid, p_token text)
RETURNS identity.organization_members
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_invite identity.organization_invites;
  v_org identity.organizations;
  v_member identity.organization_members;
  v_email text;
BEGIN
  SELECT * INTO v_invite FROM identity.organization_invites AS i
   WHERE i.token_hash = identity.hash_token(coalesce(p_token, '')) FOR UPDATE;
  IF v_invite.id IS NULL OR v_invite.status <> 'pending' OR v_invite.expires_at <= util.now() THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVITE_INVALID';
  END IF;
  SELECT * INTO v_org FROM identity.organizations AS o WHERE o.id = v_invite.organization_id;
  IF v_org.status = 'anonymized' THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVITE_INVALID'; END IF;
  SELECT lower(u.email) INTO v_email FROM auth.users AS u WHERE u.id = p_actor;
  IF v_email IS DISTINCT FROM lower(v_invite.email::text) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVITE_EMAIL_MISMATCH';
  END IF;

  INSERT INTO identity.organization_members (organization_id, account_id, role, joined_at)
  VALUES (v_invite.organization_id, p_actor, v_invite.role, util.now())
  ON CONFLICT (organization_id, account_id) DO UPDATE
     SET role = CASE WHEN identity.organization_members.status = 'active'
                     THEN identity.organization_members.role ELSE EXCLUDED.role END,
         status = 'active', removed_at = NULL,
         joined_at = CASE WHEN identity.organization_members.status = 'active'
                          THEN identity.organization_members.joined_at ELSE EXCLUDED.joined_at END
  RETURNING * INTO v_member;
  UPDATE identity.organization_invites
     SET status = 'accepted', accepted_by = p_actor, decided_at = util.now()
   WHERE id = v_invite.id;
  UPDATE identity.profiles SET last_active_role = 'requester' WHERE id = p_actor AND last_active_role IS NULL;

  IF v_invite.invited_by IS NOT NULL
     AND EXISTS (SELECT 1 FROM identity.profiles AS p WHERE p.id = v_invite.invited_by AND p.status = 'active') THEN
    PERFORM notify.enqueue('org_invite_accepted', v_invite.invited_by, jsonb_build_object(
      'organization_id', v_org.id, 'organization_name', v_org.name,
      'member_name', (SELECT p.full_name FROM identity.profiles AS p WHERE p.id = p_actor),
      'link', '/organization/members', 'app', 'requester'));
  END IF;
  PERFORM audit.record(p_actor, 'account', 'organization.invite_accepted', 'organization', v_org.id::text, NULL,
    jsonb_build_object('invite_id', v_invite.id, 'role', v_member.role));
  RETURN v_member;
END;
$$;

CREATE OR REPLACE FUNCTION identity.revoke_invite(p_actor uuid, p_org uuid, p_invite uuid)
RETURNS identity.organization_invites
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_invite identity.organization_invites;
BEGIN
  PERFORM identity.assert_org_role(p_org, p_actor, ARRAY['owner', 'admin']);
  SELECT * INTO v_invite FROM identity.organization_invites AS i
   WHERE i.id = p_invite AND i.organization_id = p_org FOR UPDATE;
  IF v_invite.id IS NULL THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_FOUND'; END IF;
  IF v_invite.status <> 'pending' THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'STATE_CHANGED'; END IF;
  UPDATE identity.organization_invites SET status = 'revoked', decided_at = util.now()
   WHERE id = p_invite RETURNING * INTO v_invite;
  PERFORM audit.record(p_actor, 'account', 'organization.invite_revoked', 'organization', p_org::text, NULL,
    jsonb_build_object('invite_id', p_invite));
  RETURN v_invite;
END;
$$;

-- Scheduled (schedule/70-accounts.sql): pending invites past their date become `expired`.
CREATE OR REPLACE FUNCTION identity.expire_org_invites() RETURNS integer
  LANGUAGE sql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
  WITH expired AS (
    UPDATE identity.organization_invites SET status = 'expired', decided_at = util.now()
     WHERE status = 'pending' AND expires_at <= util.now()
    RETURNING 1)
  SELECT count(*)::integer FROM expired
$$;

-- R-ORG-03: only the owner changes roles; the owner's own role changes only by a transfer.
CREATE OR REPLACE FUNCTION identity.set_member_role(p_actor uuid, p_org uuid, p_account uuid, p_role text)
RETURNS identity.organization_members
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_member identity.organization_members;
BEGIN
  PERFORM 1 FROM identity.organizations AS o WHERE o.id = p_org FOR UPDATE;
  PERFORM identity.assert_org_role(p_org, p_actor, ARRAY['owner']);
  IF p_role NOT IN ('admin', 'member') THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'VALIDATION_FAILED', HINT = 'role:invalid';
  END IF;
  SELECT * INTO v_member FROM identity.organization_members AS m
   WHERE m.organization_id = p_org AND m.account_id = p_account AND m.status = 'active' FOR UPDATE;
  IF v_member.account_id IS NULL THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_FOUND'; END IF;
  IF v_member.role = 'owner' THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'LAST_OWNER'; END IF;
  UPDATE identity.organization_members SET role = p_role
   WHERE organization_id = p_org AND account_id = p_account RETURNING * INTO v_member;
  PERFORM audit.record(p_actor, 'account', 'organization.member_role_changed', 'organization', p_org::text,
    NULL, jsonb_build_object('account_id', p_account, 'role', p_role));
  RETURN v_member;
END;
$$;

-- R-ORG-03: the owner hands over; the old owner becomes admin in the same transaction. The
-- organisation row is locked, so two transfers at once run one after the other.
CREATE OR REPLACE FUNCTION identity.transfer_ownership(p_actor uuid, p_org uuid, p_new_owner uuid)
RETURNS identity.organizations
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_org identity.organizations;
BEGIN
  SELECT * INTO v_org FROM identity.organizations AS o WHERE o.id = p_org FOR UPDATE;
  IF v_org.id IS NULL THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_FOUND'; END IF;
  PERFORM identity.assert_org_role(p_org, p_actor, ARRAY['owner']);
  IF p_new_owner = p_actor OR identity.member_role(p_org, p_new_owner) IS NULL
     OR NOT EXISTS (SELECT 1 FROM identity.profiles AS p WHERE p.id = p_new_owner AND p.status = 'active') THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'FORBIDDEN';
  END IF;
  UPDATE identity.organization_members SET role = 'admin'
   WHERE organization_id = p_org AND account_id = p_actor;
  UPDATE identity.organization_members SET role = 'owner'
   WHERE organization_id = p_org AND account_id = p_new_owner;
  PERFORM audit.record(p_actor, 'account', 'organization.ownership_transferred', 'organization', p_org::text,
    jsonb_build_object('owner', p_actor), jsonb_build_object('owner', p_new_owner));
  RETURN v_org;
END;
$$;

-- R-ORG-04: owner/admin remove, anyone leaves; the owner never (transfer first). The requests the
-- person created stay the organisation's (they reference the organisation, not the membership).
CREATE OR REPLACE FUNCTION identity.remove_member(p_actor uuid, p_org uuid, p_account uuid)
RETURNS identity.organization_members
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_member identity.organization_members;
BEGIN
  PERFORM 1 FROM identity.organizations AS o WHERE o.id = p_org FOR UPDATE;
  IF p_actor <> p_account THEN
    PERFORM identity.assert_org_role(p_org, p_actor, ARRAY['owner', 'admin']);
  END IF;
  SELECT * INTO v_member FROM identity.organization_members AS m
   WHERE m.organization_id = p_org AND m.account_id = p_account AND m.status = 'active' FOR UPDATE;
  IF v_member.account_id IS NULL THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_FOUND'; END IF;
  IF v_member.role = 'owner' THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'LAST_OWNER'; END IF;
  UPDATE identity.organization_members SET status = 'removed', removed_at = util.now()
   WHERE organization_id = p_org AND account_id = p_account RETURNING * INTO v_member;
  PERFORM audit.record(p_actor, 'account',
    CASE WHEN p_actor = p_account THEN 'organization.member_left' ELSE 'organization.member_removed' END,
    'organization', p_org::text, NULL, jsonb_build_object('account_id', p_account));
  RETURN v_member;
END;
$$;

-- Suspension and reactivation (R-ACC-05, R-ACC-06, D-42, D-90) --------------------------------------

-- One transaction: the account stops working at its next call (RLS and the API check the status),
-- and an interpreter leaves the directory (directory.listed_interpreters follows the status). The
-- cascade over assignments and requests arrives with them (H8, H11). A staff member is changed on
-- /team, never suspended here.
CREATE OR REPLACE FUNCTION identity.suspend_account(p_actor uuid, p_account uuid, p_reason text)
RETURNS identity.profiles
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_level text := identity.assert_staff(p_actor, ARRAY['moderator']);
  v_row identity.profiles;
BEGIN
  IF length(trim(coalesce(p_reason, ''))) < 3 THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'VALIDATION_FAILED', HINT = 'reason:required';
  END IF;
  SELECT * INTO v_row FROM identity.profiles AS p WHERE p.id = p_account FOR UPDATE;
  IF v_row.id IS NULL THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_FOUND'; END IF;
  IF p_account = p_actor OR auth_helper.staff_level_of(p_account) IS NOT NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'FORBIDDEN';
  END IF;
  IF v_row.status <> 'active' THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'STATE_CHANGED'; END IF;
  UPDATE identity.profiles
     SET status = 'suspended', suspended_at = util.now(), suspended_reason = trim(p_reason)
   WHERE id = p_account RETURNING * INTO v_row;
  PERFORM notify.enqueue('account_suspended', p_account, jsonb_build_object('reason', v_row.suspended_reason));
  PERFORM audit.record(p_actor, v_level, 'account.suspended', 'account', p_account::text,
    jsonb_build_object('status', 'active'), jsonb_build_object('status', 'suspended', 'reason', v_row.suspended_reason));
  RETURN v_row;
END;
$$;

-- R-ACC-06: back to active; nothing that was cancelled comes back.
CREATE OR REPLACE FUNCTION identity.reactivate_account(p_actor uuid, p_account uuid)
RETURNS identity.profiles
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_level text := identity.assert_staff(p_actor, ARRAY['moderator']);
  v_row identity.profiles;
BEGIN
  SELECT * INTO v_row FROM identity.profiles AS p WHERE p.id = p_account FOR UPDATE;
  IF v_row.id IS NULL THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_FOUND'; END IF;
  IF v_row.status <> 'suspended' THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'STATE_CHANGED'; END IF;
  UPDATE identity.profiles SET status = 'active', suspended_at = NULL, suspended_reason = NULL
   WHERE id = p_account RETURNING * INTO v_row;
  PERFORM audit.record(p_actor, v_level, 'account.reactivated', 'account', p_account::text,
    jsonb_build_object('status', 'suspended'), jsonb_build_object('status', 'active'));
  RETURN v_row;
END;
$$;

-- R-ACC-05 for an organisation: its requests are cancelled as for a suspended requester (H8, H11);
-- the members' accounts stay active and keep reading the history (R-ACC-03).
CREATE OR REPLACE FUNCTION identity.suspend_organization(p_actor uuid, p_org uuid, p_reason text)
RETURNS identity.organizations
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_level text := identity.assert_staff(p_actor, ARRAY['moderator']);
  v_org identity.organizations;
BEGIN
  IF length(trim(coalesce(p_reason, ''))) < 3 THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'VALIDATION_FAILED', HINT = 'reason:required';
  END IF;
  SELECT * INTO v_org FROM identity.organizations AS o WHERE o.id = p_org FOR UPDATE;
  IF v_org.id IS NULL THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_FOUND'; END IF;
  IF v_org.status <> 'active' THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'STATE_CHANGED'; END IF;
  UPDATE identity.organizations
     SET status = 'suspended', suspended_at = util.now(), suspended_reason = trim(p_reason)
   WHERE id = p_org RETURNING * INTO v_org;
  PERFORM audit.record(p_actor, v_level, 'organization.suspended', 'organization', p_org::text,
    jsonb_build_object('status', 'active'), jsonb_build_object('status', 'suspended', 'reason', v_org.suspended_reason));
  RETURN v_org;
END;
$$;

CREATE OR REPLACE FUNCTION identity.reactivate_organization(p_actor uuid, p_org uuid)
RETURNS identity.organizations
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_level text := identity.assert_staff(p_actor, ARRAY['moderator']);
  v_org identity.organizations;
BEGIN
  SELECT * INTO v_org FROM identity.organizations AS o WHERE o.id = p_org FOR UPDATE;
  IF v_org.id IS NULL THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_FOUND'; END IF;
  IF v_org.status <> 'suspended' THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'STATE_CHANGED'; END IF;
  UPDATE identity.organizations SET status = 'active', suspended_at = NULL, suspended_reason = NULL
   WHERE id = p_org RETURNING * INTO v_org;
  PERFORM audit.record(p_actor, v_level, 'organization.reactivated', 'organization', p_org::text,
    jsonb_build_object('status', 'suspended'), jsonb_build_object('status', 'active'));
  RETURN v_org;
END;
$$;

-- Anonymization (R-PRIV-03, D-96) -------------------------------------------------------------------

-- Skeleton (MASTER-PLAN H2): the personal data of identity. Every step that adds personal data
-- extends it (gate 7); H14 adds the refusals (identity.request_account_deletion), the Auth part
-- (email, password, sessions) and the screen. Refuses an owner of an organisation with other active
-- members (LAST_OWNER); a sole member takes the organisation with it ("Organização removida", the
-- NIF kept for the receipts already issued).
CREATE OR REPLACE FUNCTION identity.anonymize_account(p_account uuid) RETURNS void
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_profile identity.profiles;
  v_email text;
BEGIN
  SELECT * INTO v_profile FROM identity.profiles AS p WHERE p.id = p_account FOR UPDATE;
  IF v_profile.id IS NULL THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_FOUND'; END IF;
  IF v_profile.status = 'anonymized' THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'STATE_CHANGED'; END IF;
  IF EXISTS (SELECT 1 FROM identity.organization_members AS m
              WHERE m.account_id = p_account AND m.role = 'owner' AND m.status = 'active'
                AND EXISTS (SELECT 1 FROM identity.organization_members AS other
                             WHERE other.organization_id = m.organization_id AND other.account_id <> p_account
                               AND other.status = 'active')) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'LAST_OWNER';
  END IF;
  SELECT lower(u.email) INTO v_email FROM auth.users AS u WHERE u.id = p_account;

  -- Organisations where the account is the only active member go with it.
  UPDATE identity.organizations AS o
     SET name = 'Organização removida', sector = NULL, address = NULL, city = NULL, website_url = NULL,
         phone = NULL, status = 'anonymized', anonymized_at = util.now(), suspended_at = NULL, suspended_reason = NULL
   WHERE o.status <> 'anonymized'
     AND EXISTS (SELECT 1 FROM identity.organization_members AS m
                  WHERE m.organization_id = o.id AND m.account_id = p_account AND m.status = 'active')
     AND NOT EXISTS (SELECT 1 FROM identity.organization_members AS m
                      WHERE m.organization_id = o.id AND m.account_id <> p_account AND m.status = 'active');
  UPDATE identity.organization_members SET status = 'removed', removed_at = util.now()
   WHERE account_id = p_account AND status = 'active';
  DELETE FROM identity.organization_invites WHERE lower(email::text) = v_email OR invited_by = p_account;

  UPDATE identity.requester_profiles SET nif = NULL, address = NULL, city = NULL WHERE account_id = p_account;
  UPDATE identity.interpreter_profiles
     SET slug = 'removido-' || left(replace(gen_random_uuid()::text, '-', ''), 8),
         bio = NULL, city = NULL, contact_phone = NULL, contact_whatsapp = NULL, website_url = NULL,
         linkedin_url = NULL, instagram_url = NULL, facebook_url = NULL
   WHERE account_id = p_account;
  UPDATE identity.profiles
     SET full_name = 'Conta removida', phone = NULL, avatar_path = NULL, last_active_role = NULL,
         status = 'anonymized', anonymized_at = util.now(), suspended_at = NULL, suspended_reason = NULL
   WHERE id = p_account;
  PERFORM audit.record(p_account, 'account', 'account.anonymized', 'account', p_account::text, NULL, NULL);
END;
$$;
