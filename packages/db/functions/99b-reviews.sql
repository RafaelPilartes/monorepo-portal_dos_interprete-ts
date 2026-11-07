-- Reviews (step H9; reviews.md R-REV-01..05, D-43, D-44): each side of a completed assignment
-- reviews the other once, within review_window_days of the completion; a review stays hidden
-- until both sides reviewed or review_reveal_days passed (double blind); a moderator hides one
-- with a reason. The averages are views, never stored (R-DIR-05).

-- The database clock (util.now(), which follows util.test_clock) for the views the session reads:
-- the session runs only auth_helper functions (AD-033.1).
CREATE OR REPLACE FUNCTION auth_helper.clock() RETURNS timestamptz
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$ SELECT util.now() $$;

-- R-REV-03 (D-44): reviews of a requester are read only by an interpreter with an assignment
-- (invited, candidate or assigned) on a request that requester created.
CREATE OR REPLACE FUNCTION auth_helper.can_view_requester_reviews(p_requester uuid) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$
  SELECT auth_helper.is_active() AND EXISTS (
    SELECT 1 FROM booking.request_assignments AS a JOIN booking.requests AS r ON r.id = a.request_id
     WHERE r.created_by = p_requester AND a.interpreter_id = auth_helper.account_id())
$$;

-- R-REV-02: the review is visible to others from this moment on, and its target is told.
CREATE OR REPLACE FUNCTION booking.reveal_review(p_review uuid) RETURNS void
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_review booking.reviews;
BEGIN
  UPDATE booking.reviews SET revealed_at = util.now() WHERE id = p_review AND revealed_at IS NULL RETURNING * INTO v_review;
  -- A review the team hid is revealed (it still unblinds the pair) but never announced.
  IF v_review.id IS NOT NULL AND NOT v_review.hidden THEN
    PERFORM booking.notify_request('review_revealed', ARRAY[v_review.target_account], v_review.request_id,
      CASE WHEN v_review.author_role = 'requester' THEN 'interpreter' ELSE 'requester' END,
      jsonb_build_object('rating', v_review.rating, 'link', '/reviews'));
  END IF;
END;
$$;

-- R-REV-01: one review per side of a completed assignment, within the window. The requester's
-- side reviews the interpreter; the interpreter reviews the account that created the request.
CREATE OR REPLACE FUNCTION booking.submit_review(p_actor uuid, p_assignment uuid, p_rating integer, p_comment text)
RETURNS booking.reviews
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_request booking.requests;
  v_row booking.request_assignments;
  v_role text;
  v_review booking.reviews;
  v_other uuid;
BEGIN
  SELECT r.* INTO v_request FROM booking.requests AS r JOIN booking.request_assignments AS a ON a.request_id = r.id
   WHERE a.id = p_assignment FOR UPDATE OF r;
  SELECT * INTO v_row FROM booking.request_assignments AS a WHERE a.id = p_assignment FOR UPDATE;
  v_role := CASE WHEN v_row.interpreter_id = p_actor THEN 'interpreter'
                 WHEN booking.can_manage_request(v_row.request_id, p_actor) THEN 'requester' END;
  IF v_row.id IS NULL OR v_role IS NULL THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_FOUND'; END IF;
  IF v_row.status <> 'completed' THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'REVIEW_NOT_ALLOWED'; END IF;
  IF util.now() >= v_row.completed_at + config.require(v_request.config_version_id, 'review_window_days')::integer * interval '1 day' THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'REVIEW_WINDOW_CLOSED';
  END IF;
  IF EXISTS (SELECT 1 FROM booking.reviews AS v WHERE v.assignment_id = p_assignment AND v.author_role = v_role) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'REVIEW_EXISTS';
  END IF;
  -- AD-038.2: once the other side's review was revealed by the clock, this side no longer reviews
  -- (R-REV-02: nobody sees the other's review before giving its own; review_reveal_days is shorter
  -- than review_window_days).
  IF EXISTS (SELECT 1 FROM booking.reviews AS v WHERE v.assignment_id = p_assignment AND v.author_role <> v_role AND v.revealed_at IS NOT NULL) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'REVIEW_WINDOW_CLOSED';
  END IF;
  IF p_rating IS NULL OR p_rating NOT BETWEEN 1 AND 5 THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'VALIDATION_FAILED', HINT = 'rating:stars';
  END IF;
  INSERT INTO booking.reviews (assignment_id, request_id, author_account, author_role, target_account, rating, comment, submitted_at)
  VALUES (p_assignment, v_request.id, p_actor, v_role,
          CASE WHEN v_role = 'interpreter' THEN v_request.created_by ELSE v_row.interpreter_id END,
          p_rating, nullif(trim(coalesce(p_comment, '')), ''), util.now())
  RETURNING * INTO v_review;
  -- R-REV-02: the second side reveals both at the same instant.
  SELECT v.id INTO v_other FROM booking.reviews AS v WHERE v.assignment_id = p_assignment AND v.author_role <> v_role;
  IF v_other IS NOT NULL THEN
    PERFORM booking.reveal_review(v_other);
    PERFORM booking.reveal_review(v_review.id);
  ELSIF util.now() >= v_row.completed_at + config.require(v_request.config_version_id, 'review_reveal_days')::integer * interval '1 day' THEN
    -- Sent after the reveal deadline: visible at once, not at the next hourly run.
    PERFORM booking.reveal_review(v_review.id);
  END IF;
  SELECT * INTO v_review FROM booking.reviews AS v WHERE v.id = v_review.id;
  RETURN v_review;
END;
$$;

-- R-REV-02: a review left without an answer is revealed review_reveal_days after the completion.
CREATE OR REPLACE FUNCTION booking.reveal_reviews() RETURNS integer
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_id uuid;
  v_count integer := 0;
BEGIN
  FOR v_id IN
    SELECT v.id FROM booking.reviews AS v
      JOIN booking.request_assignments AS a ON a.id = v.assignment_id
      JOIN booking.requests AS r ON r.id = v.request_id
     WHERE v.revealed_at IS NULL
       AND a.completed_at + config.require(r.config_version_id, 'review_reveal_days')::integer * interval '1 day' <= util.now()
     ORDER BY v.submitted_at
     FOR UPDATE OF v SKIP LOCKED
  LOOP
    PERFORM booking.reveal_review(v_id);
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;

-- R-REV-04: a moderator hides a review with a reason; it stays, out of every average. Audited;
-- the author is told.
CREATE OR REPLACE FUNCTION booking.hide_review(p_actor uuid, p_review uuid, p_reason text)
RETURNS booking.reviews
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_level text := identity.assert_staff(p_actor, ARRAY['moderator']);
  v_review booking.reviews;
BEGIN
  IF length(trim(coalesce(p_reason, ''))) < 3 THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'VALIDATION_FAILED', HINT = 'reason:required';
  END IF;
  SELECT * INTO v_review FROM booking.reviews AS v WHERE v.id = p_review FOR UPDATE;
  IF v_review.id IS NULL THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_FOUND'; END IF;
  IF v_review.hidden THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'STATE_CHANGED'; END IF;
  UPDATE booking.reviews SET hidden = true, hidden_by = p_actor, hidden_reason = trim(p_reason), hidden_at = util.now()
   WHERE id = p_review RETURNING * INTO v_review;
  PERFORM audit.record(p_actor, v_level, 'review.hidden', 'review', p_review::text,
    jsonb_build_object('hidden', false), jsonb_build_object('hidden', true, 'reason', v_review.hidden_reason));
  PERFORM notify.enqueue('review_hidden', v_review.author_account, jsonb_build_object('reason', v_review.hidden_reason, 'link', '/reviews',
    'app', CASE WHEN v_review.author_role = 'requester' THEN 'requester' ELSE 'interpreter' END));
  RETURN v_review;
END;
$$;

-- review_requested: both sides are asked once the assignment completes, by any path (R-LIFE-04,
-- R-LIFE-06).
CREATE OR REPLACE FUNCTION booking.on_assignment_completed() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_who text := (SELECT p.full_name FROM identity.profiles AS p WHERE p.id = NEW.interpreter_id);
BEGIN
  PERFORM booking.notify_request('review_requested', ARRAY(SELECT auth_helper.requester_accounts(NEW.request_id)), NEW.request_id, 'requester',
    jsonb_build_object('other_name', v_who, 'link', '/reviews'));
  PERFORM booking.notify_request('review_requested', ARRAY[NEW.interpreter_id], NEW.request_id, 'interpreter',
    jsonb_build_object('other_name', (SELECT p.full_name FROM booking.requests AS r JOIN identity.profiles AS p ON p.id = r.created_by
                                       WHERE r.id = NEW.request_id), 'link', '/reviews'));
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS assignments_on_completed ON booking.request_assignments;
CREATE TRIGGER assignments_on_completed AFTER UPDATE OF status ON booking.request_assignments
  FOR EACH ROW WHEN (NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed')
  EXECUTE FUNCTION booking.on_assignment_completed();

-- The reviews as each person may read them (R-REV-03): the author always; the team always; the
-- target its own once revealed; others once revealed and not hidden — reviews of interpreters to
-- any active account, of requesters only through can_view_requester_reviews. An anonymised
-- author reads as "Conta removida". The hiding reason only to the author and the team.
CREATE OR REPLACE VIEW booking.review_details WITH (security_invoker = false) AS
SELECT v.id, v.assignment_id, v.request_id, v.author_account, v.author_role, v.target_account, v.rating, v.comment,
       v.submitted_at, v.revealed_at, v.hidden,
       CASE WHEN me.staff OR v.author_account = me.id THEN v.hidden_reason END AS hidden_reason,
       CASE WHEN pa.status = 'anonymized' THEN 'Conta removida' ELSE pa.full_name END AS author_name,
       CASE WHEN pt.status = 'anonymized' THEN 'Conta removida' ELSE pt.full_name END AS target_name,
       s.title AS service_title, r.code AS request_code
  FROM booking.reviews AS v
  JOIN identity.profiles AS pa ON pa.id = v.author_account
  JOIN identity.profiles AS pt ON pt.id = v.target_account
  JOIN booking.requests AS r ON r.id = v.request_id
  JOIN catalog.services AS s ON s.id = r.service_id
 CROSS JOIN LATERAL (SELECT (SELECT auth_helper.account_id()) AS id, (SELECT auth_helper.is_staff()) AS staff,
                            (SELECT auth_helper.is_active()) AS active) AS me
 WHERE me.staff
    OR (me.active AND v.author_account = me.id)
    OR (me.active AND v.revealed_at IS NOT NULL AND NOT v.hidden AND (
          v.target_account = me.id
          OR v.author_role = 'requester'
          OR (SELECT auth_helper.can_view_requester_reviews(v.target_account))));

-- R-DIR-05: an interpreter's average and count, over revealed reviews not hidden. Public, like
-- the directory listing, and like it only for listed interpreters (R-DIR-03).
CREATE OR REPLACE VIEW directory.interpreter_ratings WITH (security_invoker = false) AS
SELECT v.target_account AS interpreter_id, round(avg(v.rating), 1) AS rating_average, count(*)::integer AS rating_count
  FROM booking.reviews AS v
  JOIN directory.listed_ids AS l ON l.account_id = v.target_account
 WHERE v.author_role = 'requester' AND v.revealed_at IS NOT NULL AND NOT v.hidden
 GROUP BY v.target_account;

-- R-REV-05: a requester's average, for the interpreters who may read its reviews, the team and
-- the requester itself.
CREATE OR REPLACE VIEW booking.requester_ratings WITH (security_invoker = false) AS
SELECT v.target_account AS requester_id, round(avg(v.rating), 1) AS rating_average, count(*)::integer AS rating_count
  FROM booking.reviews AS v
 WHERE v.author_role = 'interpreter' AND v.revealed_at IS NOT NULL AND NOT v.hidden
   AND ((SELECT auth_helper.is_staff())
        OR ((SELECT auth_helper.is_active()) AND v.target_account = (SELECT auth_helper.account_id()))
        OR (SELECT auth_helper.can_view_requester_reviews(v.target_account)))
 GROUP BY v.target_account;

-- "Por avaliar" (/reviews): the completed assignments where the signed-in account's side has not
-- reviewed yet, with the deadline (R-REV-01).
CREATE OR REPLACE VIEW booking.reviews_to_do WITH (security_invoker = false) AS
SELECT a.id AS assignment_id, a.request_id, x.role AS author_role, r.code AS request_code, s.title AS service_title,
       CASE WHEN x.role = 'requester' THEN pi.full_name ELSE pc.full_name END AS other_name,
       a.completed_at,
       a.completed_at + c.review_window_days * interval '1 day' AS review_by,
       c.review_reveal_days AS reveal_days,
       a.completed_at + c.review_reveal_days * interval '1 day' AS reveal_at
  FROM booking.request_assignments AS a
  JOIN booking.requests AS r ON r.id = a.request_id
  JOIN catalog.services AS s ON s.id = r.service_id
  -- The version's values read as the view's owner: the session runs no config function.
  JOIN config.platform_versions AS c ON c.id = r.config_version_id
  JOIN identity.profiles AS pi ON pi.id = a.interpreter_id
  JOIN identity.profiles AS pc ON pc.id = r.created_by
 CROSS JOIN LATERAL (
   SELECT 'interpreter'::text AS role WHERE a.interpreter_id = (SELECT auth_helper.account_id())
   UNION ALL
   SELECT 'requester' WHERE (SELECT auth_helper.account_id()) IN (SELECT auth_helper.requester_accounts(a.request_id))
 ) AS x
 WHERE a.status = 'completed' AND (SELECT auth_helper.is_active())
   AND (SELECT auth_helper.clock()) < a.completed_at + c.review_window_days * interval '1 day'
   AND NOT EXISTS (SELECT 1 FROM booking.reviews AS v WHERE v.assignment_id = a.id AND v.author_role = x.role)
   -- AD-038.2: closed once the other side's review was revealed by the clock.
   AND NOT EXISTS (SELECT 1 FROM booking.reviews AS v WHERE v.assignment_id = a.id AND v.author_role <> x.role AND v.revealed_at IS NOT NULL);

-- "1 avaliação por revelar" (interpreter-profile-and-directory.md, /profile/reviews): only the count
-- of the reviews received and not yet revealed, never their content.
CREATE OR REPLACE VIEW booking.my_unrevealed_reviews WITH (security_invoker = false) AS
SELECT v.author_role, count(*)::integer AS pending_count
  FROM booking.reviews AS v
 WHERE v.target_account = (SELECT auth_helper.account_id()) AND (SELECT auth_helper.is_active()) AND v.revealed_at IS NULL
 GROUP BY v.author_role;
