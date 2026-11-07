-- The service lifecycle (step H8; service-lifecycle.md R-LIFE-01..07, accounts-and-organizations.md
-- R-ACC-05): cancel, mark as done, confirm (by hand or after completion_auto_confirm_hours),
-- disputes, and the cascade of a suspension over requests and assignments. Every change logged
-- (booking.log_event); the request's status derived by booking.refresh_request_status, except
-- the explicit cancellation of a whole request (data-model.md §5).

-- D-22: "less than cancellation_free_until_hours before the start" is strict (at 24h00 it is not late).
CREATE OR REPLACE FUNCTION booking.is_late(p_request booking.requests) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$
  SELECT p_request.starts_at - util.now()
         < config.require(p_request.config_version_id, 'cancellation_free_until_hours')::integer * interval '1 hour'
$$;

-- The threads of a request close chat_close_days after it ends (R-REQ-08).
CREATE OR REPLACE FUNCTION booking.close_threads(p_request uuid) RETURNS void
  LANGUAGE sql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
  UPDATE booking.threads AS t
     SET closes_at = util.now() + config.require(r.config_version_id, 'chat_close_days')::integer * interval '1 day'
    FROM booking.requests AS r
   WHERE t.request_id = p_request AND r.id = p_request AND t.closes_at IS NULL
$$;

-- R-LIFE-01 (and R-ACC-05): the whole request is cancelled. Every unfinished assignment is
-- cancelled by the same role; late (D-22) only for the requester, only on the accepted ones;
-- the team never cancels late. The request is locked by the caller.
CREATE OR REPLACE FUNCTION booking.cancel_whole_request(p_request booking.requests, p_actor uuid, p_role text, p_reason text, p_notice text)
RETURNS booking.requests
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_late boolean := p_role = 'requester' AND booking.is_late(p_request);
  v_row record;
  v_told uuid[] := '{}';
  v_request booking.requests;
BEGIN
  FOR v_row IN
    SELECT a.id, a.status, a.interpreter_id FROM booking.request_assignments AS a
     WHERE a.request_id = p_request.id AND a.status IN ('invited', 'applied', 'accepted') FOR UPDATE
  LOOP
    UPDATE booking.request_assignments
       SET status = 'cancelled', cancelled_by_role = p_role, cancel_reason = p_reason,
           late_cancellation = (v_late AND v_row.status = 'accepted')
     WHERE id = v_row.id;
    PERFORM booking.void_open_proposals(v_row.id);
    PERFORM booking.log_event(p_request.id, v_row.id, v_row.status, 'cancelled', p_actor, p_role, p_reason);
    v_told := v_told || v_row.interpreter_id;
  END LOOP;
  UPDATE booking.requests
     SET status = 'cancelled', cancelled_by = p_actor, cancelled_by_role = p_role, cancelled_at = util.now(), cancel_reason = p_reason
   WHERE id = p_request.id RETURNING * INTO v_request;
  PERFORM booking.log_event(p_request.id, NULL, p_request.status, 'cancelled', p_actor, p_role, p_reason);
  PERFORM booking.close_threads(p_request.id);
  PERFORM booking.notify_request(p_notice, v_told, p_request.id, 'interpreter', jsonb_build_object('reason', p_reason));
  RETURN v_request;
END;
$$;

-- R-LIFE-01: POST /requests/:id/cancel. The requester's side, or the team: a moderator any
-- request, a request operator only managed ones.
CREATE OR REPLACE FUNCTION booking.cancel_request(p_actor uuid, p_request uuid, p_reason text)
RETURNS booking.requests
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_request booking.requests;
  v_level text := auth_helper.staff_level_of(p_actor);
  v_role text;
BEGIN
  IF length(trim(coalesce(p_reason, ''))) < 3 THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'VALIDATION_FAILED', HINT = 'reason:required';
  END IF;
  SELECT * INTO v_request FROM booking.requests AS r WHERE r.id = p_request FOR UPDATE;
  IF v_request.id IS NULL THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_FOUND'; END IF;
  v_role := CASE
    WHEN booking.can_manage_request(p_request, p_actor) THEN 'requester'
    WHEN v_level IN ('super_admin', 'moderator') OR (v_level = 'request_operator' AND v_request.kind = 'managed') THEN 'staff'
  END;
  IF v_role IS NULL THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_FOUND'; END IF;
  -- A dispute is resolved, never cancelled (R-LIFE-06).
  -- Nor once any interpreter has delivered: a service done is confirmed or disputed (review of H8).
  IF v_request.status IN ('delivered', 'completed', 'disputed', 'cancelled', 'expired')
     OR EXISTS (SELECT 1 FROM booking.request_assignments AS a
                 WHERE a.request_id = p_request AND a.status IN ('delivered', 'disputed', 'completed')) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'STATE_CHANGED';
  END IF;
  RETURN booking.cancel_whole_request(v_request, p_actor, v_role, trim(p_reason), 'request_cancelled');
END;
$$;

-- R-LIFE-02: the interpreter (or the team) cancels one accepted assignment before the start.
-- Late only for the interpreter. The place reopens: the request waits for interpreters again.
CREATE OR REPLACE FUNCTION booking.cancel_assignment(p_actor uuid, p_assignment uuid, p_reason text)
RETURNS booking.request_assignments
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_request booking.requests;
  v_row booking.request_assignments;
  v_level text := auth_helper.staff_level_of(p_actor);
  v_role text;
BEGIN
  IF length(trim(coalesce(p_reason, ''))) < 3 THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'VALIDATION_FAILED', HINT = 'reason:required';
  END IF;
  SELECT r.* INTO v_request FROM booking.requests AS r JOIN booking.request_assignments AS a ON a.request_id = r.id
   WHERE a.id = p_assignment FOR UPDATE OF r;
  SELECT * INTO v_row FROM booking.request_assignments AS a WHERE a.id = p_assignment FOR UPDATE;
  v_role := CASE
    WHEN v_row.interpreter_id = p_actor THEN 'interpreter'
    WHEN v_level IN ('super_admin', 'moderator') OR (v_level = 'request_operator' AND v_request.kind = 'managed') THEN 'staff'
  END;
  IF v_row.id IS NULL OR v_role IS NULL THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_FOUND'; END IF;
  IF v_row.status <> 'accepted' OR util.now() >= v_request.starts_at THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'STATE_CHANGED';
  END IF;
  UPDATE booking.request_assignments
     SET status = 'cancelled', cancelled_by_role = v_role, cancel_reason = trim(p_reason),
         late_cancellation = (v_role = 'interpreter' AND booking.is_late(v_request))
   WHERE id = p_assignment RETURNING * INTO v_row;
  PERFORM booking.log_event(v_request.id, p_assignment, 'accepted', 'cancelled', p_actor, v_role, trim(p_reason));
  PERFORM booking.notify_request('request_cancelled', ARRAY(SELECT auth_helper.requester_accounts(v_request.id)), v_request.id, 'requester',
    jsonb_build_object('reason', trim(p_reason)) || CASE WHEN v_role = 'interpreter'
      THEN jsonb_build_object('interpreter_name', (SELECT p.full_name FROM identity.profiles AS p WHERE p.id = v_row.interpreter_id))
      ELSE '{}'::jsonb END);
  IF v_role = 'staff' THEN
    PERFORM booking.notify_request('request_cancelled', ARRAY[v_row.interpreter_id], v_request.id, 'interpreter', jsonb_build_object('reason', trim(p_reason)));
  END IF;
  PERFORM booking.refresh_request_status(v_request.id, p_actor, v_role);
  RETURN v_row;
END;
$$;

-- R-LIFE-03: the interpreter marks its accepted assignment as done, from the end of the service.
CREATE OR REPLACE FUNCTION booking.mark_delivered(p_actor uuid, p_assignment uuid)
RETURNS booking.request_assignments
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_request booking.requests;
  v_row booking.request_assignments;
BEGIN
  SELECT r.* INTO v_request FROM booking.requests AS r JOIN booking.request_assignments AS a ON a.request_id = r.id
   WHERE a.id = p_assignment FOR UPDATE OF r;
  SELECT * INTO v_row FROM booking.request_assignments AS a WHERE a.id = p_assignment FOR UPDATE;
  IF v_row.id IS NULL OR v_row.interpreter_id <> p_actor THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_FOUND'; END IF;
  IF v_row.status <> 'accepted' THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'STATE_CHANGED'; END IF;
  IF util.now() < v_request.ends_at THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_FINISHED_YET'; END IF;
  UPDATE booking.request_assignments SET status = 'delivered', delivered_at = util.now() WHERE id = p_assignment RETURNING * INTO v_row;
  PERFORM booking.log_event(v_request.id, p_assignment, 'accepted', 'delivered', p_actor, 'interpreter');
  PERFORM booking.notify_request('delivery_marked', ARRAY(SELECT auth_helper.requester_accounts(v_request.id)), v_request.id, 'requester',
    jsonb_build_object('interpreter_name', (SELECT p.full_name FROM identity.profiles AS p WHERE p.id = p_actor)));
  PERFORM booking.refresh_request_status(v_request.id, p_actor, 'interpreter');
  RETURN v_row;
END;
$$;

-- The deadline to confirm or dispute a delivered assignment (R-LIFE-04).
CREATE OR REPLACE FUNCTION booking.confirmation_deadline(p_assignment booking.request_assignments) RETURNS timestamptz
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$
  SELECT p_assignment.delivered_at + config.require(r.config_version_id, 'completion_auto_confirm_hours')::integer * interval '1 hour'
    FROM booking.requests AS r WHERE r.id = p_assignment.request_id
$$;

-- R-LIFE-04: the requester's side confirms a delivered assignment.
CREATE OR REPLACE FUNCTION booking.confirm_delivery(p_actor uuid, p_assignment uuid)
RETURNS booking.request_assignments
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_row booking.request_assignments;
BEGIN
  PERFORM 1 FROM booking.requests AS r JOIN booking.request_assignments AS a ON a.request_id = r.id WHERE a.id = p_assignment FOR UPDATE OF r;
  SELECT * INTO v_row FROM booking.request_assignments AS a WHERE a.id = p_assignment FOR UPDATE;
  IF v_row.id IS NULL OR NOT booking.can_manage_request(v_row.request_id, p_actor) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_FOUND';
  END IF;
  IF v_row.status <> 'delivered' THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'STATE_CHANGED'; END IF;
  IF util.now() >= booking.confirmation_deadline(v_row) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'CONFIRMATION_WINDOW_CLOSED';
  END IF;
  UPDATE booking.request_assignments SET status = 'completed', completed_at = util.now(), completed_via = 'requester'
   WHERE id = p_assignment RETURNING * INTO v_row;
  PERFORM booking.log_event(v_row.request_id, p_assignment, 'delivered', 'completed', p_actor, 'requester');
  PERFORM booking.refresh_request_status(v_row.request_id, p_actor, 'requester');
  RETURN v_row;
END;
$$;

-- R-LIFE-04: after completion_auto_confirm_hours without an answer, the delivery is confirmed. An
-- open dispute stops it: a disputed assignment is no longer delivered.
CREATE OR REPLACE FUNCTION booking.auto_confirm_deliveries() RETURNS integer
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_row record;
  v_count integer := 0;
BEGIN
  FOR v_row IN
    SELECT a.id, a.request_id, a.interpreter_id FROM booking.request_assignments AS a
      JOIN booking.requests AS r ON r.id = a.request_id
     WHERE a.status = 'delivered' AND booking.confirmation_deadline(a) <= util.now()
     FOR UPDATE OF r, a SKIP LOCKED
  LOOP
    UPDATE booking.request_assignments SET status = 'completed', completed_at = util.now(), completed_via = 'auto' WHERE id = v_row.id;
    PERFORM booking.log_event(v_row.request_id, v_row.id, 'delivered', 'completed', NULL, 'system');
    PERFORM booking.notify_request('delivery_auto_confirmed', ARRAY(SELECT auth_helper.requester_accounts(v_row.request_id)), v_row.request_id, 'requester');
    PERFORM booking.notify_request('delivery_auto_confirmed', ARRAY[v_row.interpreter_id], v_row.request_id, 'interpreter');
    PERFORM booking.refresh_request_status(v_row.request_id);
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;

-- R-LIFE-05: either party opens a dispute on an accepted assignment after the start, or a
-- delivered one before it completes. The other party and the moderators are told.
CREATE OR REPLACE FUNCTION booking.open_dispute(p_actor uuid, p_assignment uuid, p_reason text)
RETURNS booking.disputes
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_request booking.requests;
  v_row booking.request_assignments;
  v_role text;
  v_dispute booking.disputes;
BEGIN
  IF length(trim(coalesce(p_reason, ''))) < 3 THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'VALIDATION_FAILED', HINT = 'reason:required';
  END IF;
  SELECT r.* INTO v_request FROM booking.requests AS r JOIN booking.request_assignments AS a ON a.request_id = r.id
   WHERE a.id = p_assignment FOR UPDATE OF r;
  SELECT * INTO v_row FROM booking.request_assignments AS a WHERE a.id = p_assignment FOR UPDATE;
  v_role := CASE WHEN v_row.interpreter_id = p_actor THEN 'interpreter'
                 WHEN booking.can_manage_request(v_row.request_id, p_actor) THEN 'requester' END;
  IF v_row.id IS NULL OR v_role IS NULL THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_FOUND'; END IF;
  IF v_row.status = 'disputed' THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'DISPUTE_OPEN'; END IF;
  IF v_row.status = 'delivered' AND util.now() >= booking.confirmation_deadline(v_row) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'CONFIRMATION_WINDOW_CLOSED';
  END IF;
  IF NOT (v_row.status = 'delivered' OR (v_row.status = 'accepted' AND util.now() >= v_request.starts_at)) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'STATE_CHANGED';
  END IF;
  INSERT INTO booking.disputes (assignment_id, request_id, opened_by, opened_by_role, reason)
  VALUES (p_assignment, v_request.id, p_actor, v_role, trim(p_reason)) RETURNING * INTO v_dispute;
  UPDATE booking.request_assignments SET status = 'disputed' WHERE id = p_assignment;
  PERFORM booking.log_event(v_request.id, p_assignment, v_row.status, 'disputed', p_actor, v_role, trim(p_reason));
  PERFORM booking.notify_request('dispute_opened',
    CASE WHEN v_role = 'interpreter' THEN ARRAY(SELECT auth_helper.requester_accounts(v_request.id)) ELSE ARRAY[v_row.interpreter_id] END,
    v_request.id, CASE WHEN v_role = 'interpreter' THEN 'requester' ELSE 'interpreter' END, jsonb_build_object('reason', trim(p_reason)));
  PERFORM booking.notify_request('dispute_opened', ARRAY(
    SELECT s.account_id FROM identity.staff_members AS s WHERE s.active AND s.level IN ('moderator', 'super_admin')),
    v_request.id, 'admin', jsonb_build_object('reason', trim(p_reason)));
  PERFORM booking.refresh_request_status(v_request.id, p_actor, v_role);
  RETURN v_dispute;
END;
$$;

-- R-LIFE-06: a moderator resolves, with notes: the service counts as done, or it does not. A
-- member of the team who is a party of the request does not decide. The refund decision of
-- the managed request arrives with H11.
CREATE OR REPLACE FUNCTION booking.resolve_dispute(p_actor uuid, p_dispute uuid, p_resolution text, p_notes text)
RETURNS booking.disputes
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_level text := identity.assert_staff(p_actor, ARRAY['moderator']);
  v_dispute booking.disputes;
  v_row booking.request_assignments;
BEGIN
  IF p_resolution IS NULL OR p_resolution NOT IN ('completed', 'cancelled') THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'VALIDATION_FAILED', HINT = 'resolution:required';
  END IF;
  IF length(trim(coalesce(p_notes, ''))) < 3 THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'VALIDATION_FAILED', HINT = 'notes:required';
  END IF;
  PERFORM 1 FROM booking.requests AS r JOIN booking.disputes AS d ON d.request_id = r.id WHERE d.id = p_dispute FOR UPDATE OF r;
  SELECT * INTO v_dispute FROM booking.disputes AS d WHERE d.id = p_dispute FOR UPDATE;
  IF v_dispute.id IS NULL THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_FOUND'; END IF;
  SELECT * INTO v_row FROM booking.request_assignments AS a WHERE a.id = v_dispute.assignment_id FOR UPDATE;
  IF v_row.interpreter_id = p_actor OR booking.can_manage_request(v_dispute.request_id, p_actor)
     OR EXISTS (SELECT 1 FROM booking.requests AS r WHERE r.id = v_dispute.request_id AND r.organization_id IS NOT NULL
                  AND auth_helper.org_role_of(r.organization_id, p_actor) IS NOT NULL) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'FORBIDDEN';
  END IF;
  IF v_dispute.status <> 'open' THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'STATE_CHANGED'; END IF;
  UPDATE booking.disputes
     SET status = 'resolved', resolution = p_resolution, resolved_by = p_actor, resolved_at = util.now(), notes = trim(p_notes)
   WHERE id = p_dispute RETURNING * INTO v_dispute;
  IF p_resolution = 'completed' THEN
    UPDATE booking.request_assignments SET status = 'completed', completed_at = util.now(), completed_via = 'staff' WHERE id = v_row.id;
  ELSE
    UPDATE booking.request_assignments SET status = 'cancelled', cancelled_by_role = 'staff', cancel_reason = trim(p_notes) WHERE id = v_row.id;
  END IF;
  PERFORM booking.log_event(v_dispute.request_id, v_row.id, 'disputed', p_resolution, p_actor, 'staff', trim(p_notes));
  PERFORM audit.record(p_actor, v_level, 'dispute.resolved', 'dispute', p_dispute::text,
    jsonb_build_object('status', 'open'), jsonb_build_object('resolution', p_resolution, 'notes', trim(p_notes)));
  PERFORM booking.notify_request('dispute_resolved', ARRAY(SELECT auth_helper.requester_accounts(v_dispute.request_id)), v_dispute.request_id, 'requester',
    jsonb_build_object('resolution', p_resolution));
  PERFORM booking.notify_request('dispute_resolved', ARRAY[v_row.interpreter_id], v_dispute.request_id, 'interpreter',
    jsonb_build_object('resolution', p_resolution));
  PERFORM booking.refresh_request_status(v_dispute.request_id, p_actor, 'staff');
  RETURN v_dispute;
END;
$$;

-- R-ACC-05 (D-90): a suspension cancels what has not started yet, in the suspension's transaction.
-- A suspended interpreter: its invited, applied and accepted assignments (the team's, never late);
-- the place reopens as in R-LIFE-02. A suspended requester (or organisation): the requests it
-- created. The other party of each is told (account_suspended_counterparty).
CREATE OR REPLACE FUNCTION booking.on_account_suspended(p_actor uuid, p_account uuid) RETURNS void
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_row record;
  v_request booking.requests;
BEGIN
  FOR v_row IN
    SELECT a.id, a.status, a.request_id FROM booking.request_assignments AS a
      JOIN booking.requests AS r ON r.id = a.request_id
     WHERE a.interpreter_id = p_account AND a.status IN ('invited', 'applied', 'accepted') AND r.starts_at > util.now()
     ORDER BY r.id
     FOR UPDATE OF r, a
  LOOP
    UPDATE booking.request_assignments
       SET status = 'cancelled', cancelled_by_role = 'staff', cancel_reason = 'Conta suspensa', late_cancellation = false
     WHERE id = v_row.id;
    PERFORM booking.void_open_proposals(v_row.id);
    PERFORM booking.log_event(v_row.request_id, v_row.id, v_row.status, 'cancelled', p_actor, 'staff', 'Conta suspensa');
    PERFORM booking.notify_request('account_suspended_counterparty', ARRAY(SELECT auth_helper.requester_accounts(v_row.request_id)),
      v_row.request_id, 'requester', jsonb_build_object('place_reopened', true));
    PERFORM booking.refresh_request_status(v_row.request_id, p_actor, 'staff');
  END LOOP;
  FOR v_request IN
    SELECT r.* FROM booking.requests AS r
     WHERE r.created_by = p_account AND r.starts_at > util.now()
       AND r.status NOT IN ('delivered', 'completed', 'disputed', 'cancelled', 'expired')
     ORDER BY r.id FOR UPDATE
  LOOP
    PERFORM booking.cancel_whole_request(v_request, p_actor, 'staff', 'Conta suspensa', 'account_suspended_counterparty');
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION booking.on_organization_suspended(p_actor uuid, p_org uuid) RETURNS void
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_request booking.requests;
BEGIN
  FOR v_request IN
    SELECT r.* FROM booking.requests AS r
     WHERE r.organization_id = p_org AND r.starts_at > util.now()
       AND r.status NOT IN ('delivered', 'completed', 'disputed', 'cancelled', 'expired')
     ORDER BY r.id FOR UPDATE
  LOOP
    PERFORM booking.cancel_whole_request(v_request, p_actor, 'staff', 'Organização suspensa', 'account_suspended_counterparty');
  END LOOP;
END;
$$;

-- R-DIR-06: late cancellations of the last 12 months, per account: an interpreter's own, and a
-- requester's (one per request it cancelled late), on whoever cancelled (D-22: "no perfil de quem
-- cancelou"; an organisation's owner cancelling a member's request). Never stored; any active
-- account reads it. The window uses the real clock: the session runs no function outside
-- auth_helper (AD-033.1), and twelve months is not a deadline the tests move.
CREATE OR REPLACE VIEW directory.late_cancellations WITH (security_invoker = false) AS
SELECT x.account_id, count(*)::integer AS late_count
  FROM (
    SELECT a.interpreter_id AS account_id, a.id::text AS what
      FROM booking.request_assignments AS a JOIN booking.requests AS r ON r.id = a.request_id
     WHERE a.late_cancellation AND a.cancelled_by_role = 'interpreter' AND r.starts_at > pg_catalog.now() - interval '12 months'
    UNION
    SELECT coalesce(r.cancelled_by, r.created_by), r.id::text
      FROM booking.request_assignments AS a JOIN booking.requests AS r ON r.id = a.request_id
     WHERE a.late_cancellation AND a.cancelled_by_role = 'requester' AND r.starts_at > pg_catalog.now() - interval '12 months'
  ) AS x
 WHERE (SELECT auth_helper.is_active())
 GROUP BY x.account_id;

-- The disputes as the parties and the team read them.
CREATE OR REPLACE VIEW booking.dispute_details WITH (security_invoker = false) AS
SELECT d.id, d.assignment_id, d.request_id, d.opened_by, d.opened_by_role, d.reason, d.status, d.resolution,
       d.resolved_at, d.notes, d.created_at,
       (SELECT p.full_name FROM identity.profiles AS p WHERE p.id = d.opened_by) AS opened_by_name
  FROM booking.disputes AS d
  JOIN booking.request_assignments AS a ON a.id = d.assignment_id
 WHERE (SELECT auth_helper.is_staff(ARRAY['moderator', 'request_operator']))
    OR a.interpreter_id = (SELECT auth_helper.account_id())
    OR ((SELECT auth_helper.is_active()) AND (SELECT auth_helper.account_id()) IN (SELECT auth_helper.requester_accounts(d.request_id)));
