-- Requests: the common core and the direct request (step H5; requests-core.md, requests-direct.md,
-- data-model.md §5). Every write runs through these functions, called by the API as service_role;
-- each transition is logged (booking.log_event) and its notices leave in the same transaction.
-- A refusal that needs a value in its message carries it in HINT as "params:{json}" (AD-034).

-- R-REQ-02: the price of one interpreter for a service. Hourly: billable minutes are the larger of
-- the minimum and the duration rounded up to the step; the amount rounds up to the kwanza. Fixed:
-- the unit price, whatever the duration. The configuration is the request's (R-CFG-03).
CREATE OR REPLACE FUNCTION catalog.quote_service(p_service uuid, p_unit_price bigint, p_duration integer, p_config uuid)
RETURNS bigint
  LANGUAGE plpgsql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_mode text;
  v_minimum integer;
  v_round integer;
  v_billable integer;
BEGIN
  SELECT s.pricing_mode INTO v_mode FROM catalog.services AS s WHERE s.id = p_service;
  IF v_mode IS NULL THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_FOUND'; END IF;
  IF v_mode = 'fixed' THEN RETURN p_unit_price; END IF;
  v_minimum := config.require(p_config, 'billing_minimum_minutes')::integer;
  v_round := config.require(p_config, 'billing_round_minutes')::integer;
  -- A step of 0 cannot round anything: the configuration is incomplete, not a division by zero.
  IF v_round <= 0 THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'CONFIG_VALUE_MISSING',
      DETAIL = format('billing_round_minutes is %s in version %s', v_round, p_config);
  END IF;
  v_billable := greatest(v_minimum, ceil(p_duration::numeric / v_round)::integer * v_round);
  RETURN ceil(p_unit_price::numeric * v_billable / 60)::bigint;
END;
$$;

-- The people who act for the requester of a request: its creator and, in an organisation, the
-- owners and admins (notifications.md, "solicitante").
CREATE OR REPLACE FUNCTION auth_helper.requester_accounts(p_request uuid) RETURNS SETOF uuid
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$
  SELECT r.created_by FROM booking.requests AS r WHERE r.id = p_request
  UNION
  SELECT m.account_id FROM booking.requests AS r
    JOIN identity.organization_members AS m ON m.organization_id = r.organization_id
   WHERE r.id = p_request AND m.status = 'active' AND m.role IN ('owner', 'admin')
$$;

-- Who may act on a request as its requester: the creator, or an owner or admin of its organisation.
CREATE OR REPLACE FUNCTION booking.can_manage_request(p_request uuid, p_account uuid) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$ SELECT p_account IN (SELECT auth_helper.requester_accounts(p_request)) $$;

-- R-REQ-07: who sees a request. Open requests (H7) add the eligible interpreters.
CREATE OR REPLACE FUNCTION auth_helper.can_view_request(p_request uuid) RETURNS boolean
  -- plpgsql: it names directory.is_eligible_for, defined further down this file.
  LANGUAGE plpgsql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$
BEGIN
  RETURN auth_helper.is_active() AND (
    auth_helper.is_staff()
    OR EXISTS (SELECT 1 FROM booking.requests AS r
                WHERE r.id = p_request
                  AND (r.created_by = auth_helper.account_id()
                       OR (r.organization_id IS NOT NULL AND auth_helper.org_role(r.organization_id) IS NOT NULL)))
    OR EXISTS (SELECT 1 FROM booking.request_assignments AS a
                WHERE a.request_id = p_request AND a.interpreter_id = auth_helper.account_id())
    -- R-OPN-01: an open request waiting for interpreters, for the eligible ones.
    OR EXISTS (SELECT 1 FROM booking.requests AS r
                WHERE r.id = p_request AND r.kind = 'open' AND r.status = 'awaiting_interpreters'
                  AND (directory.is_eligible_for(auth_helper.account_id(), p_request)).eligible));
END;
$$;

-- D-16, D-95: who sees the beneficiary, the exact address and the notes. The requester's side,
-- the team and the interpreters already accepted.
CREATE OR REPLACE FUNCTION auth_helper.can_see_request_private(p_request uuid) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$
  SELECT auth_helper.is_active() AND (
    auth_helper.is_staff()
    OR EXISTS (SELECT 1 FROM booking.requests AS r
                WHERE r.id = p_request
                  AND (r.created_by = auth_helper.account_id()
                       OR (r.organization_id IS NOT NULL AND auth_helper.org_role(r.organization_id) IS NOT NULL)))
    OR EXISTS (SELECT 1 FROM booking.request_assignments AS a
                WHERE a.request_id = p_request AND a.interpreter_id = auth_helper.account_id()
                  AND a.status IN ('accepted', 'delivered', 'disputed', 'completed')))
$$;

-- R-REQ-08: the participants of a thread. The requester's side and the interpreter of the
-- assignment; the team only in the managed thread (the team reads the others through the API).
CREATE OR REPLACE FUNCTION auth_helper.is_thread_participant(p_thread uuid) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$
  SELECT auth_helper.is_active() AND EXISTS (
    SELECT 1 FROM booking.threads AS t
      LEFT JOIN booking.request_assignments AS a ON a.id = t.assignment_id
     WHERE t.id = p_thread
       AND (auth_helper.account_id() IN (SELECT auth_helper.requester_accounts(t.request_id))
            OR a.interpreter_id = auth_helper.account_id()
            OR (t.kind = 'requester_team' AND auth_helper.is_staff())))
$$;

-- R-REQ-11: one line in the request log and one in the audit, by the function that made the change.
CREATE OR REPLACE FUNCTION booking.log_event(
  p_request uuid, p_assignment uuid, p_from text, p_to text, p_actor uuid, p_role text, p_reason text DEFAULT NULL
) RETURNS void
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
BEGIN
  INSERT INTO booking.request_events (request_id, assignment_id, from_status, to_status, actor_account, actor_role, reason, at)
  VALUES (p_request, p_assignment, p_from, p_to, p_actor, p_role, p_reason, util.now());
  PERFORM audit.record(p_actor, p_role,
    CASE WHEN p_assignment IS NULL THEN 'request.' ELSE 'assignment.' END || p_to,
    CASE WHEN p_assignment IS NULL THEN 'request' ELSE 'assignment' END,
    coalesce(p_assignment, p_request)::text,
    CASE WHEN p_from IS NULL THEN NULL ELSE jsonb_build_object('status', p_from) END,
    jsonb_build_object('status', p_to, 'request_id', p_request, 'reason', p_reason));
END;
$$;

-- A notice to every account of a list, with the request's link in the right app.
CREATE OR REPLACE FUNCTION booking.notify_request(p_kind text, p_accounts uuid[], p_request uuid, p_app text, p_extra jsonb DEFAULT '{}')
RETURNS void
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_request booking.requests;
  v_service text;
  v_account uuid;
BEGIN
  SELECT * INTO v_request FROM booking.requests AS r WHERE r.id = p_request;
  SELECT s.title INTO v_service FROM catalog.services AS s WHERE s.id = v_request.service_id;
  FOREACH v_account IN ARRAY coalesce(p_accounts, '{}') LOOP
    PERFORM notify.enqueue(p_kind, v_account, jsonb_build_object(
      'request_id', p_request, 'code', v_request.code, 'service', v_service, 'starts_at', v_request.starts_at,
      'app', p_app, 'link', '/requests/' || p_request) || p_extra);
  END LOOP;
END;
$$;

-- R-DIR-09: whether an interpreter may receive a request, and why not, in Portuguese.
CREATE OR REPLACE FUNCTION directory.is_eligible_for(p_interpreter uuid, p_request uuid, OUT eligible boolean, OUT reason text)
  LANGUAGE plpgsql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_request booking.requests;
  v_modality text;
  v_missing text;
  v_service text;
BEGIN
  eligible := false;
  SELECT * INTO v_request FROM booking.requests AS r WHERE r.id = p_request;
  IF v_request.id IS NULL THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_FOUND'; END IF;
  IF NOT EXISTS (SELECT 1 FROM directory.listed_ids AS l WHERE l.account_id = p_interpreter) THEN
    reason := 'não está disponível no directório'; RETURN;
  END IF;
  IF p_interpreter = v_request.created_by OR (v_request.organization_id IS NOT NULL
       AND auth_helper.org_role_of(v_request.organization_id, p_interpreter) IS NOT NULL) THEN
    reason := 'não pode receber um pedido seu ou da sua organização'; RETURN;
  END IF;
  -- Every language of the request, counted only while active in the catalog.
  SELECT string_agg(c.name, ', ' ORDER BY c.sort) INTO v_missing
    FROM booking.request_languages AS rl JOIN catalog.languages AS c ON c.id = rl.language_id
   WHERE rl.request_id = p_request
     AND NOT EXISTS (SELECT 1 FROM directory.interpreter_languages AS il
                      WHERE il.interpreter_id = p_interpreter AND il.language_id = rl.language_id AND c.active);
  IF v_missing IS NOT NULL THEN reason := format('não interpreta %s', v_missing); RETURN; END IF;
  IF NOT EXISTS (SELECT 1 FROM directory.interpreter_services AS s
                  WHERE s.interpreter_id = p_interpreter AND s.service_id = v_request.service_id AND s.active) THEN
    SELECT c.title INTO v_service FROM catalog.services AS c WHERE c.id = v_request.service_id;
    reason := format('não oferece o serviço %s', v_service); RETURN;
  END IF;
  SELECT i.modality INTO v_modality FROM identity.interpreter_profiles AS i WHERE i.account_id = p_interpreter;
  IF v_modality IS DISTINCT FROM 'both' AND v_modality IS DISTINCT FROM v_request.modality THEN
    reason := CASE v_request.modality WHEN 'online' THEN 'não trabalha online' ELSE 'não trabalha presencialmente' END;
    RETURN;
  END IF;
  eligible := true;
END;
$$;

-- R-REQ-08: the thread of an assignment (or the team thread of a managed request), created once.
CREATE OR REPLACE FUNCTION booking.ensure_thread(p_request uuid, p_assignment uuid) RETURNS uuid
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_assignment IS NULL THEN
    SELECT t.id INTO v_id FROM booking.threads AS t WHERE t.request_id = p_request AND t.kind = 'requester_team';
  ELSE
    SELECT t.id INTO v_id FROM booking.threads AS t WHERE t.assignment_id = p_assignment;
  END IF;
  IF v_id IS NULL THEN
    INSERT INTO booking.threads (request_id, assignment_id, kind)
    VALUES (p_request, p_assignment, CASE WHEN p_assignment IS NULL THEN 'requester_team' ELSE 'requester_interpreter' END)
    RETURNING id INTO v_id;
  END IF;
  RETURN v_id;
END;
$$;

-- R-REQ-04: the status of a request after its creation, derived from its active assignments (the
-- order of data-model.md §5). The only function that chooses among the derived statuses. The
-- managed payment step (4) arrives with the payments (H11).
CREATE OR REPLACE FUNCTION booking.refresh_request_status(p_request uuid, p_actor uuid DEFAULT NULL, p_role text DEFAULT 'system')
RETURNS text
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_request booking.requests;
  v_active integer;
  v_disputed integer;
  v_completed integer;
  v_delivered integer;
  v_status text;
BEGIN
  SELECT * INTO v_request FROM booking.requests AS r WHERE r.id = p_request FOR UPDATE;
  IF v_request.status IN ('awaiting_approval', 'quoting', 'completed', 'cancelled', 'expired') THEN
    RETURN v_request.status;
  END IF;
  SELECT count(*) FILTER (WHERE a.status IN ('accepted', 'delivered', 'disputed', 'completed')),
         count(*) FILTER (WHERE a.status = 'disputed'),
         count(*) FILTER (WHERE a.status = 'completed'),
         count(*) FILTER (WHERE a.status IN ('delivered', 'completed'))
    INTO v_active, v_disputed, v_completed, v_delivered
    FROM booking.request_assignments AS a WHERE a.request_id = p_request;
  v_status := CASE
    WHEN v_disputed > 0 THEN 'disputed'
    -- After the start a place no longer reopens (a dispute resolved as cancelled, R-LIFE-07);
    -- a request already waiting at the start stays waiting for R-REQ-10.
    WHEN v_active = 0 AND (v_request.ends_at <= util.now()
                           OR (v_request.starts_at <= util.now() AND v_request.status <> 'awaiting_interpreters')) THEN 'cancelled'
    WHEN v_active < v_request.interpreters_needed
         AND (v_request.starts_at > util.now() OR v_request.status = 'awaiting_interpreters') THEN 'awaiting_interpreters'
    WHEN v_completed = v_active THEN 'completed'
    WHEN v_delivered = v_active THEN 'delivered'
    ELSE 'confirmed' END;
  IF v_status <> v_request.status THEN
    UPDATE booking.requests SET status = v_status WHERE id = p_request;
    PERFORM booking.log_event(p_request, NULL, v_request.status, v_status, p_actor, p_role);
    -- Only on the way in: back from a dispute is not a new confirmation (review of H8).
    IF v_status = 'confirmed' AND v_request.status = 'awaiting_interpreters' THEN
      PERFORM booking.notify_request('request_confirmed', ARRAY(SELECT auth_helper.requester_accounts(p_request)), p_request, 'requester');
      PERFORM booking.notify_request('request_confirmed', ARRAY(
        SELECT a.interpreter_id FROM booking.request_assignments AS a
         WHERE a.request_id = p_request AND a.status = 'accepted'), p_request, 'interpreter');
    END IF;
    IF v_status IN ('completed', 'cancelled') THEN
      PERFORM booking.close_threads(p_request);
    END IF;
  END IF;
  RETURN v_status;
END;
$$;

-- R-DRC-01: one invite. The price offered is the interpreter's price for the service through
-- catalog.quote_service; the travel fee only in person (D-17). Called by the API and by
-- booking.create_request for the initial invites. The request is locked by the caller.
CREATE OR REPLACE FUNCTION booking.add_invite(p_request booking.requests, p_interpreter uuid, p_actor uuid)
RETURNS booking.request_assignments
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_check record;
  v_taken integer;
  v_price bigint;
  v_travel bigint;
  v_row booking.request_assignments;
BEGIN
  IF p_request.kind <> 'direct' OR p_request.status <> 'awaiting_interpreters' THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'STATE_CHANGED';
  END IF;
  SELECT count(*) INTO v_taken FROM booking.request_assignments AS a
   WHERE a.request_id = p_request.id AND a.status IN ('invited', 'accepted', 'delivered', 'disputed', 'completed');
  IF v_taken >= p_request.interpreters_needed THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'SLOTS_FULL';
  END IF;
  IF EXISTS (SELECT 1 FROM booking.request_assignments AS a WHERE a.request_id = p_request.id AND a.interpreter_id = p_interpreter) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'VALIDATION_FAILED', HINT = 'interpreter_id:already_invited';
  END IF;
  SELECT * INTO v_check FROM directory.is_eligible_for(p_interpreter, p_request.id);
  IF NOT v_check.eligible THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INTERPRETER_NOT_ELIGIBLE',
      HINT = 'params:' || jsonb_build_object('reason', v_check.reason)::text;
  END IF;
  SELECT catalog.quote_service(p_request.service_id, s.price_aoa, p_request.duration_minutes, p_request.config_version_id),
         CASE WHEN p_request.modality = 'in_person' THEN coalesce(i.travel_fee_aoa, 0) ELSE 0 END
    INTO v_price, v_travel
    FROM directory.interpreter_services AS s
    JOIN identity.interpreter_profiles AS i ON i.account_id = s.interpreter_id
   WHERE s.interpreter_id = p_interpreter AND s.service_id = p_request.service_id;
  INSERT INTO booking.request_assignments (request_id, interpreter_id, origin, status, offered_price_aoa, offered_travel_fee_aoa, invite_expires_at)
  VALUES (p_request.id, p_interpreter, 'invited', 'invited', v_price, v_travel,
          -- R-DRC-02 (D-24): never after the start.
          least(util.now() + config.require(p_request.config_version_id, 'invite_expiry_hours')::integer * interval '1 hour',
                p_request.starts_at))
  RETURNING * INTO v_row;
  PERFORM booking.ensure_thread(p_request.id, v_row.id);
  PERFORM booking.log_event(p_request.id, v_row.id, NULL, 'invited', p_actor, 'requester');
  PERFORM booking.notify_request('request_invited', ARRAY[p_interpreter], p_request.id, 'interpreter',
    jsonb_build_object('invite_expires_at', v_row.invite_expires_at));
  RETURN v_row;
END;
$$;

-- R-DRC-01, R-DRC-05: POST /requests/:id/invites.
CREATE OR REPLACE FUNCTION booking.invite_interpreter(p_actor uuid, p_request uuid, p_interpreter uuid)
RETURNS booking.request_assignments
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_request booking.requests;
BEGIN
  SELECT * INTO v_request FROM booking.requests AS r WHERE r.id = p_request FOR UPDATE;
  IF v_request.id IS NULL OR NOT booking.can_manage_request(p_request, p_actor) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_FOUND';
  END IF;
  RETURN booking.add_invite(v_request, p_interpreter, p_actor);
END;
$$;

-- R-REQ-02: the totals of a request before it exists, per interpreter and in all, for the review
-- screen (POST /requests/preview) and for the PRICE_CHANGED check of create_request. Direct: each
-- chosen interpreter's price plus the travel fee in person.
CREATE OR REPLACE FUNCTION booking.preview_request_total(p_input jsonb)
RETURNS jsonb
  LANGUAGE plpgsql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_config uuid := config.current_version_id();
  v_service uuid := (p_input ->> 'service_id')::uuid;
  v_duration integer := (p_input ->> 'duration_minutes')::integer;
  v_in_person boolean := p_input ->> 'modality' = 'in_person';
  v_lines jsonb;
BEGIN
  -- Open requests (H7): "first to accept" pays the budget per place, everything included (D-92);
  -- "I choose" has no total until a candidate is chosen, each one proposes its own price.
  IF p_input ->> 'kind' = 'open' THEN
    RETURN jsonb_build_object('lines', '[]'::jsonb, 'total_aoa',
      CASE WHEN p_input ->> 'open_mode' = 'first_accept'
           THEN coalesce((p_input ->> 'budget_per_interpreter_aoa')::bigint, 0) * coalesce((p_input ->> 'interpreters_needed')::integer, 1)
           ELSE 0 END);
  END IF;
  SELECT coalesce(jsonb_agg(jsonb_build_object(
           'interpreter_id', s.interpreter_id,
           'price_aoa', catalog.quote_service(v_service, s.price_aoa, v_duration, v_config),
           'travel_fee_aoa', CASE WHEN v_in_person THEN coalesce(i.travel_fee_aoa, 0) ELSE 0 END)), '[]')
    INTO v_lines
    FROM (SELECT DISTINCT x AS id FROM jsonb_array_elements_text(coalesce(p_input -> 'interpreter_ids', '[]')) AS x) AS chosen
    JOIN directory.interpreter_services AS s ON s.interpreter_id = chosen.id::uuid AND s.service_id = v_service AND s.active
    JOIN identity.interpreter_profiles AS i ON i.account_id = s.interpreter_id;
  RETURN jsonb_build_object(
    'lines', v_lines,
    'total_aoa', (SELECT coalesce(sum((line ->> 'price_aoa')::bigint + (line ->> 'travel_fee_aoa')::bigint), 0)
                    FROM jsonb_array_elements(v_lines) AS line));
END;
$$;

-- R-REQ-01: create a request, everything checked in the database, in one transaction: the request,
-- its languages, the initial invites (direct) and the first line of the log; an open request
-- tells its eligible interpreters (R-OPN-01).
CREATE OR REPLACE FUNCTION booking.create_request(p_actor uuid, p_input jsonb)
RETURNS booking.requests
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_config uuid := config.current_version_id();
  v_kind text := p_input ->> 'kind';
  v_org uuid := nullif(p_input ->> 'organization_id', '')::uuid;
  v_service catalog.services;
  v_languages uuid[] := ARRAY(SELECT DISTINCT x::uuid FROM jsonb_array_elements_text(coalesce(p_input -> 'language_ids', '[]')) AS x);
  v_interpreters uuid[] := ARRAY(SELECT DISTINCT x::uuid FROM jsonb_array_elements_text(coalesce(p_input -> 'interpreter_ids', '[]')) AS x);
  v_starts timestamptz := (p_input ->> 'starts_at')::timestamptz;
  v_duration integer := (p_input ->> 'duration_minutes')::integer;
  v_needed integer := coalesce((p_input ->> 'interpreters_needed')::integer, 1);
  v_modality text := p_input ->> 'modality';
  v_link text := nullif(trim(p_input ->> 'meeting_link'), '');
  v_address text := nullif(trim(p_input ->> 'address'), '');
  v_mode text := nullif(p_input ->> 'open_mode', '');
  v_budget bigint := (p_input ->> 'budget_per_interpreter_aoa')::bigint;
  v_lead integer;
  v_max integer;
  v_request booking.requests;
  v_interpreter uuid;
  v_total bigint;
BEGIN
  -- Who: a requester; in an organisation, an active member of an active organisation.
  IF v_org IS NULL THEN
    IF NOT EXISTS (SELECT 1 FROM identity.requester_profiles AS r WHERE r.account_id = p_actor) THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'FORBIDDEN';
    END IF;
  ELSIF auth_helper.org_role_of(v_org, p_actor) IS NULL
        OR (SELECT o.status FROM identity.organizations AS o WHERE o.id = v_org) <> 'active' THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'FORBIDDEN';
  END IF;
  -- Direct (H5) and open (H7); the managed request arrives with H11 (AD-034).
  IF v_kind IS NULL OR v_kind NOT IN ('direct', 'open') THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'VALIDATION_FAILED', HINT = 'kind:not_available';
  END IF;
  IF v_kind = 'open' THEN
    IF v_mode IS NULL OR v_mode NOT IN ('first_accept', 'requester_chooses') THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'VALIDATION_FAILED', HINT = 'open_mode:required';
    END IF;
    IF v_mode = 'first_accept' AND coalesce(v_budget, 0) <= 0 THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'BUDGET_REQUIRED';
    END IF;
    -- Nobody is invited to an open request: the eligible interpreters see it.
    v_interpreters := '{}';
  END IF;
  SELECT * INTO v_service FROM catalog.services AS s WHERE s.id = (p_input ->> 'service_id')::uuid;
  IF v_service.id IS NULL OR NOT v_service.active THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'SERVICE_INACTIVE';
  END IF;
  IF cardinality(v_languages) = 0 THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'LANGUAGE_REQUIRED';
  END IF;
  IF EXISTS (SELECT 1 FROM unnest(v_languages) AS l (id)
              WHERE NOT EXISTS (SELECT 1 FROM catalog.languages AS c WHERE c.id = l.id AND c.active)) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'VALIDATION_FAILED', HINT = 'language_ids:invalid';
  END IF;
  v_lead := config.require(v_config, 'request_min_lead_minutes')::integer;
  IF v_starts IS NULL OR v_starts < util.now() + v_lead * interval '1 minute' THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'START_TOO_SOON', HINT = 'params:' || jsonb_build_object('min', v_lead)::text;
  END IF;
  IF v_duration IS NULL OR v_duration NOT BETWEEN 15 AND 720 THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'DURATION_OUT_OF_RANGE';
  END IF;
  v_max := config.require(v_config, 'max_interpreters_per_request')::integer;
  IF v_needed < 1 OR v_needed > v_max THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'TOO_MANY_INTERPRETERS', HINT = 'params:' || jsonb_build_object('max', v_max)::text;
  END IF;
  IF v_modality = 'online' AND v_link IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'MEETING_LINK_REQUIRED';
  END IF;
  IF v_link IS NOT NULL AND v_link !~ '^https://' THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVALID_MEETING_LINK';
  END IF;
  IF v_modality = 'in_person' AND v_address IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'ADDRESS_REQUIRED';
  END IF;
  IF cardinality(v_interpreters) > v_needed THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'SLOTS_FULL';
  END IF;
  -- The total the review showed must still be the total (PRICE_CHANGED).
  v_total := (booking.preview_request_total(p_input) ->> 'total_aoa')::bigint;
  IF (p_input ->> 'expected_total_aoa')::bigint IS DISTINCT FROM v_total THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'PRICE_CHANGED';
  END IF;

  INSERT INTO booking.requests (code, kind, open_mode, budget_per_interpreter_aoa, created_by, organization_id, service_id,
    modality, starts_at, duration_minutes,
    meeting_link, address, city, notes, beneficiary_name, beneficiary_contact, interpreters_needed, is_urgent,
    config_version_id, status)
  VALUES (util.next_code('PI'), v_kind, CASE WHEN v_kind = 'open' THEN v_mode END,
    CASE WHEN v_kind = 'open' AND v_mode = 'first_accept' THEN v_budget END, p_actor, v_org, v_service.id,
    v_modality, v_starts, v_duration,
    v_link, CASE WHEN v_modality = 'in_person' THEN v_address END, nullif(trim(p_input ->> 'city'), ''),
    nullif(trim(p_input ->> 'notes'), ''), nullif(trim(p_input ->> 'beneficiary_name'), ''),
    nullif(trim(p_input ->> 'beneficiary_contact'), ''), v_needed,
    -- D-19: urgent when it starts within the threshold.
    v_starts < util.now() + config.require(v_config, 'urgent_threshold_hours')::integer * interval '1 hour',
    v_config, 'awaiting_interpreters')
  RETURNING * INTO v_request;
  INSERT INTO booking.request_languages (request_id, language_id) SELECT v_request.id, unnest(v_languages);
  PERFORM booking.log_event(v_request.id, NULL, NULL, 'awaiting_interpreters', p_actor, 'requester');
  FOREACH v_interpreter IN ARRAY v_interpreters LOOP
    PERFORM booking.add_invite(v_request, v_interpreter, p_actor);
  END LOOP;
  -- R-OPN-01: the eligible interpreters are told, in the Portal only.
  IF v_kind = 'open' THEN
    PERFORM booking.notify_request('open_request_new', ARRAY(
      SELECT l.account_id FROM directory.listed_ids AS l
       WHERE (directory.is_eligible_for(l.account_id, v_request.id)).eligible), v_request.id, 'interpreter',
      jsonb_build_object('link', '/open-requests'));
  END IF;
  RETURN v_request;
END;
$$;

-- R-DRC-03: the invited interpreter accepts. The price is fixed now (D-14); the overlap
-- constraint decides here (R-REQ-05), with the margin of the request's configuration.
CREATE OR REPLACE FUNCTION booking.accept_assignment(p_actor uuid, p_assignment uuid)
RETURNS booking.request_assignments
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_assignment booking.request_assignments;
  v_request booking.requests;
  v_active integer;
  v_buffer integer;
BEGIN
  SELECT r.* INTO v_request FROM booking.requests AS r
    JOIN booking.request_assignments AS a ON a.request_id = r.id WHERE a.id = p_assignment FOR UPDATE OF r;
  SELECT * INTO v_assignment FROM booking.request_assignments AS a WHERE a.id = p_assignment FOR UPDATE;
  IF v_assignment.id IS NULL OR v_assignment.interpreter_id <> p_actor THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_FOUND';
  END IF;
  IF v_assignment.status <> 'invited' OR v_request.status <> 'awaiting_interpreters' THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'STATE_CHANGED';
  END IF;
  IF util.now() >= v_assignment.invite_expires_at THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVITE_EXPIRED';
  END IF;
  SELECT count(*) INTO v_active FROM booking.request_assignments AS a
   WHERE a.request_id = v_request.id AND a.status IN ('accepted', 'delivered', 'disputed', 'completed');
  IF v_active >= v_request.interpreters_needed THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'SLOTS_FULL';
  END IF;
  v_buffer := config.require(v_request.config_version_id, 'overlap_buffer_minutes')::integer;
  BEGIN
    UPDATE booking.request_assignments
       SET status = 'accepted', responded_at = util.now(),
           agreed_price_aoa = offered_price_aoa, agreed_travel_fee_aoa = offered_travel_fee_aoa,
           period = tstzrange(v_request.starts_at, v_request.ends_at + v_buffer * interval '1 minute', '[)')
     WHERE id = p_assignment RETURNING * INTO v_assignment;
  EXCEPTION WHEN exclusion_violation THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'SCHEDULE_OVERLAP';
  END;
  -- R-DRC-03: the negotiation of this thread closes; the price offered in force is the one fixed.
  PERFORM booking.void_open_proposals(p_assignment);
  PERFORM booking.log_event(v_request.id, p_assignment, 'invited', 'accepted', p_actor, 'interpreter');
  PERFORM booking.notify_request('request_accepted', ARRAY(SELECT auth_helper.requester_accounts(v_request.id)), v_request.id, 'requester',
    jsonb_build_object('interpreter_name', (SELECT p.full_name FROM identity.profiles AS p WHERE p.id = p_actor)));
  PERFORM booking.refresh_request_status(v_request.id, p_actor, 'interpreter');
  RETURN v_assignment;
END;
$$;

-- R-DRC-04: the invited interpreter declines, with a reason the requester reads.
CREATE OR REPLACE FUNCTION booking.decline_assignment(p_actor uuid, p_assignment uuid, p_reason text)
RETURNS booking.request_assignments
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_assignment booking.request_assignments;
BEGIN
  IF length(trim(coalesce(p_reason, ''))) < 3 THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'VALIDATION_FAILED', HINT = 'reason:required';
  END IF;
  PERFORM 1 FROM booking.requests AS r JOIN booking.request_assignments AS a ON a.request_id = r.id
   WHERE a.id = p_assignment FOR UPDATE OF r;
  SELECT * INTO v_assignment FROM booking.request_assignments AS a WHERE a.id = p_assignment FOR UPDATE;
  IF v_assignment.id IS NULL OR v_assignment.interpreter_id <> p_actor THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_FOUND';
  END IF;
  IF v_assignment.status <> 'invited' THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'STATE_CHANGED'; END IF;
  UPDATE booking.request_assignments
     SET status = 'declined', responded_at = util.now(), decline_reason = trim(p_reason)
   WHERE id = p_assignment RETURNING * INTO v_assignment;
  PERFORM booking.void_open_proposals(p_assignment);
  PERFORM booking.log_event(v_assignment.request_id, p_assignment, 'invited', 'declined', p_actor, 'interpreter', trim(p_reason));
  PERFORM booking.notify_request('request_declined', ARRAY(SELECT auth_helper.requester_accounts(v_assignment.request_id)),
    v_assignment.request_id, 'requester', jsonb_build_object(
      'interpreter_name', (SELECT p.full_name FROM identity.profiles AS p WHERE p.id = p_actor), 'reason', trim(p_reason)));
  RETURN v_assignment;
END;
$$;

-- R-REQ-09: go on with fewer interpreters. Pending invites beyond the new number are cancelled,
-- the newest first (the oldest keep their place), and their interpreters told; the request is
-- confirmed if it is now full.
CREATE OR REPLACE FUNCTION booking.reduce_interpreters_needed(p_actor uuid, p_request uuid, p_needed integer)
RETURNS booking.requests
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_request booking.requests;
  v_active integer;
  v_cancel record;
BEGIN
  SELECT * INTO v_request FROM booking.requests AS r WHERE r.id = p_request FOR UPDATE;
  IF v_request.id IS NULL OR NOT booking.can_manage_request(p_request, p_actor) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_FOUND';
  END IF;
  IF v_request.status <> 'awaiting_interpreters' THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'STATE_CHANGED'; END IF;
  SELECT count(*) INTO v_active FROM booking.request_assignments AS a
   WHERE a.request_id = p_request AND a.status IN ('accepted', 'delivered', 'disputed', 'completed');
  IF p_needed IS NULL OR p_needed < greatest(v_active, 1) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'CANNOT_REDUCE_BELOW_ACCEPTED',
      HINT = 'params:' || jsonb_build_object('accepted', v_active)::text;
  END IF;
  IF p_needed >= v_request.interpreters_needed THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'VALIDATION_FAILED', HINT = 'interpreters_needed:invalid';
  END IF;
  UPDATE booking.requests SET interpreters_needed = p_needed WHERE id = p_request;
  -- Invites hold places; candidates do not (R-OPN-03), so only invites beyond the places go.
  FOR v_cancel IN
    SELECT a.id, a.status, a.interpreter_id FROM booking.request_assignments AS a
     WHERE a.request_id = p_request AND a.status = 'invited'
     ORDER BY a.created_at, a.id
     OFFSET greatest(p_needed - v_active, 0)
  LOOP
    UPDATE booking.request_assignments SET status = 'cancelled', cancelled_by_role = 'requester', cancel_reason = 'Pedido reduzido'
     WHERE id = v_cancel.id;
    PERFORM booking.void_open_proposals(v_cancel.id);
    PERFORM booking.log_event(p_request, v_cancel.id, v_cancel.status, 'cancelled', p_actor, 'requester', 'Pedido reduzido');
    PERFORM booking.notify_request('request_cancelled', ARRAY[v_cancel.interpreter_id], p_request, 'interpreter',
      jsonb_build_object('reason', 'O solicitante seguiu com menos intérpretes'));
  END LOOP;
  -- Full now: the candidates still waiting are not selected, as when the requester chooses.
  IF v_active >= p_needed THEN PERFORM booking.close_applications(p_request, p_actor); END IF;
  PERFORM booking.refresh_request_status(p_request, p_actor, 'requester');
  SELECT * INTO v_request FROM booking.requests AS r WHERE r.id = p_request;
  RETURN v_request;
END;
$$;

-- R-REQ-06, D-20: the meeting link. The requester's side before the first acceptance; an accepted
-- interpreter until the start. Every change tells the other parties.
CREATE OR REPLACE FUNCTION booking.update_meeting_link(p_actor uuid, p_request uuid, p_link text)
RETURNS booking.requests
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_request booking.requests;
  v_accepted boolean;
  v_as_requester boolean;
  v_as_interpreter boolean;
BEGIN
  SELECT * INTO v_request FROM booking.requests AS r WHERE r.id = p_request FOR UPDATE;
  IF v_request.id IS NULL THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_FOUND'; END IF;
  v_as_requester := booking.can_manage_request(p_request, p_actor);
  v_as_interpreter := EXISTS (SELECT 1 FROM booking.request_assignments AS a
                               WHERE a.request_id = p_request AND a.interpreter_id = p_actor AND a.status = 'accepted');
  IF NOT v_as_requester AND NOT v_as_interpreter THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_FOUND'; END IF;
  IF v_request.modality <> 'online' OR v_request.status IN ('completed', 'cancelled', 'expired') THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'STATE_CHANGED';
  END IF;
  IF trim(coalesce(p_link, '')) !~ '^https://' THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVALID_MEETING_LINK';
  END IF;
  v_accepted := EXISTS (SELECT 1 FROM booking.request_assignments AS a
                         WHERE a.request_id = p_request AND a.status IN ('accepted', 'delivered', 'disputed', 'completed'));
  IF (NOT v_as_interpreter AND v_accepted) OR (v_as_interpreter AND util.now() >= v_request.starts_at) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'REQUEST_LOCKED';
  END IF;
  UPDATE booking.requests SET meeting_link = trim(p_link) WHERE id = p_request RETURNING * INTO v_request;
  PERFORM audit.record(p_actor, CASE WHEN v_as_interpreter THEN 'interpreter' ELSE 'requester' END,
    'request.meeting_link_changed', 'request', p_request::text, NULL, jsonb_build_object('meeting_link', v_request.meeting_link));
  PERFORM booking.notify_request('meeting_link_changed', ARRAY(
    SELECT x FROM auth_helper.requester_accounts(p_request) AS x WHERE x <> p_actor), p_request, 'requester');
  PERFORM booking.notify_request('meeting_link_changed', ARRAY(
    SELECT a.interpreter_id FROM booking.request_assignments AS a
     WHERE a.request_id = p_request AND a.status = 'accepted' AND a.interpreter_id <> p_actor), p_request, 'interpreter');
  RETURN v_request;
END;
$$;

-- Scheduled tasks --------------------------------------------------------------------------------

-- R-DRC-02: invites past their deadline expire; the requester is told.
CREATE OR REPLACE FUNCTION booking.expire_invites() RETURNS integer
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_row record;
  v_count integer := 0;
BEGIN
  -- The request is locked before its assignment, in the same order as accept and decline.
  FOR v_row IN
    SELECT a.id, a.request_id, a.interpreter_id FROM booking.request_assignments AS a
      JOIN booking.requests AS r ON r.id = a.request_id
     WHERE a.status = 'invited' AND a.invite_expires_at <= util.now()
     FOR UPDATE OF r, a SKIP LOCKED
  LOOP
    UPDATE booking.request_assignments SET status = 'expired' WHERE id = v_row.id;
    PERFORM booking.void_open_proposals(v_row.id);
    PERFORM booking.log_event(v_row.request_id, v_row.id, 'invited', 'expired', NULL, 'system');
    PERFORM booking.notify_request('request_invite_expired', ARRAY(SELECT auth_helper.requester_accounts(v_row.request_id)),
      v_row.request_id, 'requester', jsonb_build_object(
        'interpreter_name', (SELECT p.full_name FROM identity.profiles AS p WHERE p.id = v_row.interpreter_id)));
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;

-- R-REQ-10, first half: staffing_warning_hours before the start, a request still short of
-- interpreters warns its requester once.
CREATE OR REPLACE FUNCTION booking.warn_understaffed() RETURNS integer
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_row record;
  v_count integer := 0;
BEGIN
  FOR v_row IN
    SELECT r.id, r.interpreters_needed,
           (SELECT count(*) FROM booking.request_assignments AS a
             WHERE a.request_id = r.id AND a.status IN ('accepted', 'delivered', 'disputed', 'completed')) AS accepted
      FROM booking.requests AS r
     WHERE r.status = 'awaiting_interpreters' AND r.understaffed_warned_at IS NULL AND r.starts_at > util.now()
       AND r.starts_at <= util.now() + config.require(r.config_version_id, 'staffing_warning_hours')::integer * interval '1 hour'
     FOR UPDATE OF r SKIP LOCKED
  LOOP
    UPDATE booking.requests SET understaffed_warned_at = util.now() WHERE id = v_row.id;
    PERFORM booking.notify_request('request_understaffed_warning', ARRAY(SELECT auth_helper.requester_accounts(v_row.id)),
      v_row.id, 'requester', jsonb_build_object('accepted', v_row.accepted, 'needed', v_row.interpreters_needed));
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;

-- R-REQ-10, second half: at the start, a request still short of interpreters expires. Accepted
-- interpreters are released (system, never a late cancellation); everyone is told; the threads
-- close chat_close_days later.
CREATE OR REPLACE FUNCTION booking.expire_unstaffed_requests() RETURNS integer
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_request record;
  v_assignment record;
  v_accepted uuid[];
  v_count integer := 0;
BEGIN
  FOR v_request IN
    SELECT r.id, r.status, r.config_version_id FROM booking.requests AS r
     WHERE r.status IN ('awaiting_approval', 'quoting', 'awaiting_interpreters') AND r.starts_at <= util.now()
     FOR UPDATE SKIP LOCKED
  LOOP
    v_accepted := ARRAY(SELECT a.interpreter_id FROM booking.request_assignments AS a
                         WHERE a.request_id = v_request.id AND a.status IN ('accepted', 'applied'));
    -- Candidates are not selected (data-model.md §5) and told with everyone else.
    PERFORM booking.close_applications(v_request.id, NULL, false);
    FOR v_assignment IN
      SELECT a.id, a.status FROM booking.request_assignments AS a
       WHERE a.request_id = v_request.id AND a.status IN ('invited', 'accepted')
    LOOP
      UPDATE booking.request_assignments
         SET status = CASE WHEN v_assignment.status = 'accepted' THEN 'cancelled' ELSE 'expired' END,
             cancelled_by_role = CASE WHEN v_assignment.status = 'accepted' THEN 'system' END,
             late_cancellation = false
       WHERE id = v_assignment.id;
      PERFORM booking.void_open_proposals(v_assignment.id);
      PERFORM booking.log_event(v_request.id, v_assignment.id, v_assignment.status,
        CASE WHEN v_assignment.status = 'accepted' THEN 'cancelled' ELSE 'expired' END, NULL, 'system', 'Pedido sem intérpretes suficientes');
    END LOOP;
    UPDATE booking.requests SET status = 'expired' WHERE id = v_request.id;
    PERFORM booking.log_event(v_request.id, NULL, v_request.status, 'expired', NULL, 'system', 'Pedido sem intérpretes suficientes');
    UPDATE booking.threads
       SET closes_at = util.now() + config.require(v_request.config_version_id, 'chat_close_days')::integer * interval '1 day'
     WHERE request_id = v_request.id AND closes_at IS NULL;
    PERFORM booking.notify_request('request_expired', ARRAY(SELECT auth_helper.requester_accounts(v_request.id)), v_request.id, 'requester');
    PERFORM booking.notify_request('request_expired', v_accepted, v_request.id, 'interpreter');
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;

-- Chat: the role of the sender, from the thread (the screen never says who it is).
CREATE OR REPLACE FUNCTION booking.set_message_sender() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = ''
AS $$
BEGIN
  NEW.sender_role := CASE
    WHEN EXISTS (SELECT 1 FROM booking.threads AS t JOIN booking.request_assignments AS a ON a.id = t.assignment_id
                  WHERE t.id = NEW.thread_id AND a.interpreter_id = NEW.sender_account) THEN 'interpreter'
    WHEN NEW.sender_account IN (SELECT auth_helper.requester_accounts(t.request_id) FROM booking.threads AS t WHERE t.id = NEW.thread_id) THEN 'requester'
    ELSE 'staff' END;
  NEW.created_at := util.now();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS messages_set_sender ON booking.messages;
CREATE TRIGGER messages_set_sender BEFORE INSERT ON booking.messages
  FOR EACH ROW EXECUTE FUNCTION booking.set_message_sender();
