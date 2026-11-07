-- The open request (step H7; requests-open.md R-OPN-01..04). "First to accept": the first N
-- eligible interpreters take the places at the budget, everything included (D-92). "I choose":
-- the eligible interpreters apply at their own price; the requester picks among them.

-- R-OPN-04, R-REQ-09, R-REQ-10: the candidates still waiting are not selected and, unless the
-- caller tells them otherwise (expiry), told so. The request is locked by the caller.
CREATE OR REPLACE FUNCTION booking.close_applications(p_request uuid, p_actor uuid, p_notify boolean DEFAULT true)
RETURNS void
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_other record;
BEGIN
  FOR v_other IN
    SELECT a.id, a.interpreter_id FROM booking.request_assignments AS a
     WHERE a.request_id = p_request AND a.status = 'applied' FOR UPDATE
  LOOP
    UPDATE booking.request_assignments SET status = 'not_selected', responded_at = util.now() WHERE id = v_other.id;
    PERFORM booking.void_open_proposals(v_other.id);
    PERFORM booking.log_event(p_request, v_other.id, 'applied', 'not_selected', p_actor,
      CASE WHEN p_actor IS NULL THEN 'system' ELSE 'requester' END);
    IF p_notify THEN
      PERFORM booking.notify_request('open_application_not_selected', ARRAY[v_other.interpreter_id], p_request, 'interpreter');
    END IF;
  END LOOP;
END;
$$;

-- The open request of a call, locked, still waiting for interpreters, in the given mode.
CREATE OR REPLACE FUNCTION booking.lock_open_request(p_request uuid, p_mode text) RETURNS booking.requests
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_request booking.requests;
BEGIN
  SELECT * INTO v_request FROM booking.requests AS r WHERE r.id = p_request FOR UPDATE;
  IF v_request.id IS NULL OR v_request.kind <> 'open' THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_FOUND'; END IF;
  -- From the start, nobody takes or chooses a place: R-REQ-10 decides.
  IF v_request.open_mode <> p_mode OR util.now() >= v_request.starts_at THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'STATE_CHANGED';
  END IF;
  IF v_request.status <> 'awaiting_interpreters' THEN
    -- Whoever arrives after the last place was taken is told so (criterion 1).
    RAISE EXCEPTION USING ERRCODE = 'P0001',
      MESSAGE = CASE WHEN booking.active_count(p_request) >= v_request.interpreters_needed THEN 'SLOTS_FULL' ELSE 'STATE_CHANGED' END;
  END IF;
  RETURN v_request;
END;
$$;

CREATE OR REPLACE FUNCTION booking.active_count(p_request uuid) RETURNS integer
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$
  SELECT count(*)::integer FROM booking.request_assignments AS a
   WHERE a.request_id = p_request AND a.status IN ('accepted', 'delivered', 'disputed', 'completed')
$$;

-- R-DIR-09 for an action: the interpreter may take this request, or INTERPRETER_NOT_ELIGIBLE with the reason.
CREATE OR REPLACE FUNCTION booking.assert_eligible(p_interpreter uuid, p_request uuid) RETURNS void
  LANGUAGE plpgsql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_check record;
BEGIN
  SELECT * INTO v_check FROM directory.is_eligible_for(p_interpreter, p_request);
  IF NOT v_check.eligible THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INTERPRETER_NOT_ELIGIBLE',
      HINT = 'params:' || jsonb_build_object('reason', v_check.reason)::text;
  END IF;
END;
$$;

-- R-OPN-02: "first to accept". The request row lock serialises the places: the first N stay, the
-- next one gets SLOTS_FULL. The price is the budget, fixed now, with no travel fee (D-92).
CREATE OR REPLACE FUNCTION booking.accept_open_request(p_actor uuid, p_request uuid)
RETURNS booking.request_assignments
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_request booking.requests := booking.lock_open_request(p_request, 'first_accept');
  v_buffer integer := config.require(v_request.config_version_id, 'overlap_buffer_minutes')::integer;
  v_row booking.request_assignments;
BEGIN
  IF EXISTS (SELECT 1 FROM booking.request_assignments AS a WHERE a.request_id = p_request AND a.interpreter_id = p_actor) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'STATE_CHANGED';
  END IF;
  PERFORM booking.assert_eligible(p_actor, p_request);
  IF booking.active_count(p_request) >= v_request.interpreters_needed THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'SLOTS_FULL';
  END IF;
  BEGIN
    INSERT INTO booking.request_assignments (request_id, interpreter_id, origin, status, offered_price_aoa, offered_travel_fee_aoa,
      agreed_price_aoa, agreed_travel_fee_aoa, period, responded_at)
    VALUES (p_request, p_actor, 'applied', 'accepted', v_request.budget_per_interpreter_aoa, 0,
      v_request.budget_per_interpreter_aoa, 0,
      tstzrange(v_request.starts_at, v_request.ends_at + v_buffer * interval '1 minute', '[)'), util.now())
    RETURNING * INTO v_row;
  EXCEPTION WHEN exclusion_violation THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'SCHEDULE_OVERLAP';
  END;
  PERFORM booking.ensure_thread(p_request, v_row.id);
  PERFORM booking.log_event(p_request, v_row.id, NULL, 'accepted', p_actor, 'interpreter');
  PERFORM booking.notify_request('request_accepted', ARRAY(SELECT auth_helper.requester_accounts(p_request)), p_request, 'requester',
    jsonb_build_object('interpreter_name', (SELECT p.full_name FROM identity.profiles AS p WHERE p.id = p_actor)));
  PERFORM booking.refresh_request_status(p_request, p_actor, 'interpreter');
  RETURN v_row;
END;
$$;

-- R-OPN-03: "I choose". A firm offer at the interpreter's own price for the service (and its
-- travel fee in person) until withdrawn or changed by the negotiation. No limit of candidates.
CREATE OR REPLACE FUNCTION booking.apply_to_request(p_actor uuid, p_request uuid, p_message text)
RETURNS booking.request_assignments
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_request booking.requests := booking.lock_open_request(p_request, 'requester_chooses');
  v_row booking.request_assignments;
BEGIN
  IF EXISTS (SELECT 1 FROM booking.request_assignments AS a WHERE a.request_id = p_request AND a.interpreter_id = p_actor) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'STATE_CHANGED';
  END IF;
  PERFORM booking.assert_eligible(p_actor, p_request);
  IF booking.active_count(p_request) >= v_request.interpreters_needed THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'SLOTS_FULL';
  END IF;
  INSERT INTO booking.request_assignments (request_id, interpreter_id, origin, status, offered_price_aoa, offered_travel_fee_aoa,
    application_message)
  SELECT p_request, p_actor, 'applied', 'applied',
         catalog.quote_service(v_request.service_id, s.price_aoa, v_request.duration_minutes, v_request.config_version_id),
         CASE WHEN v_request.modality = 'in_person' THEN coalesce(i.travel_fee_aoa, 0) ELSE 0 END,
         nullif(trim(p_message), '')
    FROM directory.interpreter_services AS s JOIN identity.interpreter_profiles AS i ON i.account_id = s.interpreter_id
   WHERE s.interpreter_id = p_actor AND s.service_id = v_request.service_id
  RETURNING * INTO v_row;
  PERFORM booking.ensure_thread(p_request, v_row.id);
  PERFORM booking.log_event(p_request, v_row.id, NULL, 'applied', p_actor, 'interpreter');
  PERFORM booking.notify_request('open_application_received', ARRAY(SELECT auth_helper.requester_accounts(p_request)), p_request, 'requester',
    jsonb_build_object('interpreter_name', (SELECT p.full_name FROM identity.profiles AS p WHERE p.id = p_actor)));
  RETURN v_row;
END;
$$;

-- R-OPN-03: the candidate withdraws its application.
CREATE OR REPLACE FUNCTION booking.withdraw_application(p_actor uuid, p_assignment uuid)
RETURNS booking.request_assignments
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_row booking.request_assignments;
BEGIN
  PERFORM 1 FROM booking.requests AS r JOIN booking.request_assignments AS a ON a.request_id = r.id
   WHERE a.id = p_assignment FOR UPDATE OF r;
  SELECT * INTO v_row FROM booking.request_assignments AS a WHERE a.id = p_assignment FOR UPDATE;
  IF v_row.id IS NULL OR v_row.interpreter_id <> p_actor THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_FOUND'; END IF;
  IF v_row.status <> 'applied' THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'STATE_CHANGED'; END IF;
  UPDATE booking.request_assignments SET status = 'withdrawn', responded_at = util.now() WHERE id = p_assignment RETURNING * INTO v_row;
  PERFORM booking.void_open_proposals(p_assignment);
  PERFORM booking.log_event(v_row.request_id, p_assignment, 'applied', 'withdrawn', p_actor, 'interpreter');
  RETURN v_row;
END;
$$;

-- R-OPN-04: the requester chooses a candidate. The choice is the acceptance (D-14): the price
-- offered in force is fixed and the period written (an overlap refuses, R-REQ-05). When the
-- places are all taken, the other candidates become not_selected and are told.
CREATE OR REPLACE FUNCTION booking.select_candidate(p_actor uuid, p_request uuid, p_assignment uuid)
RETURNS booking.request_assignments
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_request booking.requests := booking.lock_open_request(p_request, 'requester_chooses');
  v_buffer integer := config.require(v_request.config_version_id, 'overlap_buffer_minutes')::integer;
  v_row booking.request_assignments;
BEGIN
  IF NOT booking.can_manage_request(p_request, p_actor) THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_FOUND'; END IF;
  SELECT * INTO v_row FROM booking.request_assignments AS a WHERE a.id = p_assignment AND a.request_id = p_request FOR UPDATE;
  IF v_row.id IS NULL THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_FOUND'; END IF;
  IF v_row.status <> 'applied' THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'STATE_CHANGED'; END IF;
  IF booking.active_count(p_request) >= v_request.interpreters_needed THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'SLOTS_FULL';
  END IF;
  BEGIN
    UPDATE booking.request_assignments
       SET status = 'accepted', responded_at = util.now(),
           agreed_price_aoa = offered_price_aoa, agreed_travel_fee_aoa = offered_travel_fee_aoa,
           period = tstzrange(v_request.starts_at, v_request.ends_at + v_buffer * interval '1 minute', '[)')
     WHERE id = p_assignment RETURNING * INTO v_row;
  EXCEPTION WHEN exclusion_violation THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'SCHEDULE_OVERLAP';
  END;
  PERFORM booking.void_open_proposals(p_assignment);
  PERFORM booking.log_event(p_request, p_assignment, 'applied', 'accepted', p_actor, 'requester');
  IF booking.active_count(p_request) >= v_request.interpreters_needed THEN
    PERFORM booking.close_applications(p_request, p_actor);
  END IF;
  PERFORM booking.refresh_request_status(p_request, p_actor, 'requester');
  RETURN v_row;
END;
$$;

-- R-OPN-01: the open requests for the signed-in interpreter, with the value it would earn: the
-- budget in "first to accept", its own price (and travel fee in person) in "I choose". Only those
-- waiting, with a free place, it is eligible for and has not answered yet. Without the
-- beneficiary, the address or the notes (D-95). In auth_helper: the session runs only these.
CREATE OR REPLACE FUNCTION auth_helper.open_requests_for_me()
RETURNS TABLE (id uuid, code text, open_mode text, service_id uuid, service_title text, pricing_mode text, modality text,
  starts_at timestamptz, duration_minutes integer, city text, is_urgent boolean, interpreters_needed integer,
  accepted_count integer, language_names text[], value_aoa bigint, travel_fee_aoa bigint)
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$
  SELECT r.id, r.code, r.open_mode, r.service_id, s.title, s.pricing_mode, r.modality, r.starts_at, r.duration_minutes, r.city,
         r.is_urgent, r.interpreters_needed, booking.active_count(r.id),
         coalesce((SELECT array_agg(c.name ORDER BY c.sort) FROM booking.request_languages AS rl
                     JOIN catalog.languages AS c ON c.id = rl.language_id WHERE rl.request_id = r.id), '{}'),
         CASE WHEN r.open_mode = 'first_accept' THEN r.budget_per_interpreter_aoa
              ELSE catalog.quote_service(r.service_id, mine.price_aoa, r.duration_minutes, r.config_version_id) END,
         CASE WHEN r.open_mode = 'first_accept' OR r.modality = 'online' THEN 0 ELSE coalesce(me.travel_fee_aoa, 0) END
    FROM booking.requests AS r
    JOIN catalog.services AS s ON s.id = r.service_id
    JOIN identity.interpreter_profiles AS me ON me.account_id = auth_helper.account_id()
    LEFT JOIN directory.interpreter_services AS mine ON mine.interpreter_id = me.account_id AND mine.service_id = r.service_id
   WHERE auth_helper.is_active()
     AND r.kind = 'open' AND r.status = 'awaiting_interpreters' AND r.starts_at > util.now()
     AND booking.active_count(r.id) < r.interpreters_needed
     AND NOT EXISTS (SELECT 1 FROM booking.request_assignments AS a WHERE a.request_id = r.id AND a.interpreter_id = me.account_id)
     AND (directory.is_eligible_for(me.account_id, r.id)).eligible
   ORDER BY r.starts_at
$$;

CREATE OR REPLACE VIEW booking.open_requests_for_me WITH (security_invoker = false) AS
SELECT * FROM auth_helper.open_requests_for_me();
