-- Price negotiation (step H6; negotiation.md, D-13, D-14). In the thread of a direct (or open
-- "requester chooses", H7) assignment, while it is invited or applied. A proposal accepted changes
-- the price offered; only the acceptance of the request fixes the price (agreed_price_aoa). The
-- managed request's thread with the team arrives with H11.

-- Who the actor is in the thread, or NULL when not a participant.
CREATE OR REPLACE FUNCTION booking.thread_role(p_thread uuid, p_account uuid) RETURNS text
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$
  SELECT CASE
    WHEN a.interpreter_id = p_account THEN 'interpreter'
    WHEN p_account IN (SELECT auth_helper.requester_accounts(t.request_id)) THEN 'requester'
  END
    FROM booking.threads AS t LEFT JOIN booking.request_assignments AS a ON a.id = t.assignment_id
   WHERE t.id = p_thread
$$;

-- R-NEG-01: the assignment of a thread while it may still be negotiated, locked; or NEGOTIATION_CLOSED.
CREATE OR REPLACE FUNCTION booking.open_negotiation(p_thread uuid) RETURNS booking.request_assignments
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_request booking.requests;
  v_assignment booking.request_assignments;
BEGIN
  SELECT r.* INTO v_request FROM booking.requests AS r JOIN booking.threads AS t ON t.request_id = r.id
   WHERE t.id = p_thread FOR UPDATE OF r;
  SELECT a.* INTO v_assignment FROM booking.request_assignments AS a JOIN booking.threads AS t ON t.assignment_id = a.id
   WHERE t.id = p_thread FOR UPDATE OF a;
  IF v_assignment.id IS NULL OR v_assignment.status NOT IN ('invited', 'applied')
     OR v_request.open_mode IS NOT DISTINCT FROM 'first_accept' OR v_request.status <> 'awaiting_interpreters' THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NEGOTIATION_CLOSED';
  END IF;
  RETURN v_assignment;
END;
$$;

-- R-NEG-01, R-NEG-02, R-NEG-04, R-NEG-05: a new proposal; the open one of the thread becomes void.
CREATE OR REPLACE FUNCTION booking.make_proposal(p_actor uuid, p_thread uuid, p_amount bigint)
RETURNS booking.proposals
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_role text := booking.thread_role(p_thread, p_actor);
  v_assignment booking.request_assignments;
  v_row booking.proposals;
  v_other uuid[];
BEGIN
  IF v_role IS NULL THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_FOUND'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVALID_AMOUNT'; END IF;
  v_assignment := booking.open_negotiation(p_thread);
  IF v_role = 'requester' AND NOT (SELECT i.accepts_negotiation FROM identity.interpreter_profiles AS i
                                    WHERE i.account_id = v_assignment.interpreter_id) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NEGOTIATION_DISABLED';
  END IF;
  UPDATE booking.proposals SET status = 'void' WHERE thread_id = p_thread AND status = 'open';
  INSERT INTO booking.proposals (thread_id, request_id, assignment_id, proposed_by, proposed_by_role, amount_aoa, previous_amount_aoa)
  VALUES (p_thread, v_assignment.request_id, v_assignment.id, p_actor, v_role, p_amount, v_assignment.offered_price_aoa)
  RETURNING * INTO v_row;
  PERFORM audit.record(p_actor, v_role, 'proposal.made', 'assignment', v_assignment.id::text, NULL,
    jsonb_build_object('proposal_id', v_row.id, 'amount_aoa', p_amount, 'previous_amount_aoa', v_assignment.offered_price_aoa));
  v_other := CASE WHEN v_role = 'requester' THEN ARRAY[v_assignment.interpreter_id]
                  ELSE ARRAY(SELECT auth_helper.requester_accounts(v_assignment.request_id)) END;
  PERFORM booking.notify_request('proposal_received', v_other, v_assignment.request_id,
    CASE WHEN v_role = 'requester' THEN 'interpreter' ELSE 'requester' END,
    jsonb_build_object('amount_aoa', p_amount, 'previous_amount_aoa', v_assignment.offered_price_aoa));
  RETURN v_row;
END;
$$;

-- R-NEG-02, R-NEG-03: the other party accepts or rejects. Accepting changes the price offered
-- (offered_price_aoa); agreed_price_aoa is written only when the interpreter accepts the request.
CREATE OR REPLACE FUNCTION booking.respond_proposal(p_actor uuid, p_proposal uuid, p_accept boolean)
RETURNS booking.proposals
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_row booking.proposals;
  v_role text;
BEGIN
  SELECT * INTO v_row FROM booking.proposals AS p WHERE p.id = p_proposal;
  v_role := booking.thread_role(v_row.thread_id, p_actor);
  IF v_row.id IS NULL OR v_role IS NULL THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_FOUND'; END IF;
  -- The request and the assignment are locked first, in the same order as every other change.
  IF p_accept THEN
    PERFORM booking.open_negotiation(v_row.thread_id);
  ELSE
    PERFORM 1 FROM booking.requests AS r WHERE r.id = v_row.request_id FOR UPDATE;
  END IF;
  SELECT * INTO v_row FROM booking.proposals AS p WHERE p.id = p_proposal FOR UPDATE;
  IF v_row.status <> 'open' THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'PROPOSAL_NOT_OPEN'; END IF;
  IF v_role = v_row.proposed_by_role THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'OWN_PROPOSAL'; END IF;
  UPDATE booking.proposals
     SET status = CASE WHEN p_accept THEN 'accepted' ELSE 'rejected' END, responded_by = p_actor, responded_at = util.now()
   WHERE id = p_proposal RETURNING * INTO v_row;
  IF p_accept THEN
    UPDATE booking.request_assignments SET offered_price_aoa = v_row.amount_aoa WHERE id = v_row.assignment_id;
  END IF;
  PERFORM audit.record(p_actor, v_role, 'proposal.' || v_row.status, 'assignment', v_row.assignment_id::text,
    jsonb_build_object('offered_price_aoa', v_row.previous_amount_aoa),
    jsonb_build_object('proposal_id', v_row.id, 'status', v_row.status, 'amount_aoa', v_row.amount_aoa));
  PERFORM booking.notify_request('proposal_answered', ARRAY[v_row.proposed_by], v_row.request_id,
    CASE WHEN v_row.proposed_by_role = 'interpreter' THEN 'interpreter' ELSE 'requester' END,
    jsonb_build_object('amount_aoa', v_row.amount_aoa, 'accepted', p_accept));
  RETURN v_row;
END;
$$;

-- The proposals of a thread as the chat shows them (participants only, R-REQ-08).
CREATE OR REPLACE VIEW booking.proposal_details WITH (security_invoker = false) AS
SELECT p.id, p.thread_id, p.request_id, p.assignment_id, p.proposed_by, p.proposed_by_role, p.amount_aoa,
       p.previous_amount_aoa, p.status, p.responded_at, p.created_at,
       (SELECT pr.full_name FROM identity.profiles AS pr WHERE pr.id = p.proposed_by) AS proposed_by_name
  FROM booking.proposals AS p
 WHERE (SELECT auth_helper.is_thread_participant(p.thread_id));
