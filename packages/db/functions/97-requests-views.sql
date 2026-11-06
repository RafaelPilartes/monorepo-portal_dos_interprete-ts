-- The requests as the screens read them (R-REQ-07, D-16, D-95). They run as their owner and filter
-- the rows themselves: only who may see a request reads it, and the beneficiary, the exact address
-- and the notes only for the requester's side, the team and the accepted interpreters.

-- What the lifecycle screens show before an action (service-lifecycle.md "Ecrãs"), from the same
-- rules the actions use: whether a cancellation now would be late (D-22), and until when a
-- delivery can be confirmed or disputed (R-LIFE-04). plpgsql: they name functions of 99-lifecycle.sql.
CREATE OR REPLACE FUNCTION auth_helper.cancel_is_late(p_request uuid) RETURNS boolean
  LANGUAGE plpgsql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$
BEGIN
  RETURN (SELECT booking.is_late(r) FROM booking.requests AS r WHERE r.id = p_request);
END;
$$;

CREATE OR REPLACE FUNCTION auth_helper.confirmation_deadline(p_assignment uuid) RETURNS timestamptz
  LANGUAGE plpgsql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$
BEGIN
  RETURN (SELECT booking.confirmation_deadline(a) FROM booking.request_assignments AS a WHERE a.id = p_assignment AND a.delivered_at IS NOT NULL);
END;
$$;

CREATE OR REPLACE VIEW booking.request_details WITH (security_invoker = false) AS
SELECT r.id, r.code, r.kind, r.open_mode, r.created_by, r.organization_id, r.service_id, s.title AS service_title,
       s.pricing_mode, r.modality, r.starts_at, r.duration_minutes, r.ends_at, r.city, r.interpreters_needed,
       r.is_urgent, r.status, r.config_version_id, r.created_at,
       -- The meeting link, like the address, only for who takes part (review of H7).
       CASE WHEN p.private OR EXISTS (SELECT 1 FROM booking.request_assignments AS a
                                       WHERE a.request_id = r.id AND a.interpreter_id = (SELECT auth_helper.account_id()))
            THEN r.meeting_link END AS meeting_link,
       CASE WHEN p.private THEN r.address END AS address,
       CASE WHEN p.private THEN r.notes END AS notes,
       CASE WHEN p.private THEN r.beneficiary_name END AS beneficiary_name,
       CASE WHEN p.private THEN r.beneficiary_contact END AS beneficiary_contact,
       coalesce((SELECT array_agg(c.name ORDER BY c.sort) FROM booking.request_languages AS rl
                   JOIN catalog.languages AS c ON c.id = rl.language_id WHERE rl.request_id = r.id), '{}') AS language_names,
       (SELECT count(*)::integer FROM booking.request_assignments AS a
         WHERE a.request_id = r.id AND a.status IN ('accepted', 'delivered', 'disputed', 'completed')) AS accepted_count,
       (SELECT pr.full_name FROM identity.profiles AS pr WHERE pr.id = r.created_by) AS created_by_name,
       (SELECT o.name FROM identity.organizations AS o WHERE o.id = r.organization_id) AS organization_name,
       (SELECT auth_helper.account_id() IN (SELECT auth_helper.requester_accounts(r.id))) AS can_manage,
       r.budget_per_interpreter_aoa,
       (SELECT auth_helper.cancel_is_late(r.id)) AS cancel_is_late,
       r.cancel_reason, r.cancelled_by_role
  FROM booking.requests AS r
  JOIN catalog.services AS s ON s.id = r.service_id
 CROSS JOIN LATERAL (SELECT auth_helper.can_see_request_private(r.id) AS private) AS p
 WHERE (SELECT auth_helper.can_view_request(r.id));

-- The interpreters of a request with their state and price. The requester's side and the team see
-- every line; an interpreter sees only its own (another's price is not its business).
CREATE OR REPLACE VIEW booking.assignment_details WITH (security_invoker = false) AS
SELECT a.id, a.request_id, a.interpreter_id, i.slug AS interpreter_slug, pr.full_name AS interpreter_name,
       pr.avatar_path AS interpreter_avatar_path, a.origin, a.status, a.offered_price_aoa, a.offered_travel_fee_aoa,
       a.agreed_price_aoa, a.agreed_travel_fee_aoa, a.invite_expires_at, a.responded_at, a.decline_reason,
       a.cancel_reason, a.created_at, t.id AS thread_id, i.accepts_negotiation, a.application_message,
       a.delivered_at, a.completed_at, a.completed_via, a.late_cancellation, a.cancelled_by_role,
       (SELECT auth_helper.confirmation_deadline(a.id)) AS confirm_by,
       (SELECT d.id FROM booking.disputes AS d WHERE d.assignment_id = a.id AND d.status = 'open') AS open_dispute_id
  FROM booking.request_assignments AS a
  JOIN identity.interpreter_profiles AS i ON i.account_id = a.interpreter_id
  JOIN identity.profiles AS pr ON pr.id = a.interpreter_id
  LEFT JOIN booking.threads AS t ON t.assignment_id = a.id
 WHERE a.interpreter_id = (SELECT auth_helper.account_id())
    OR (SELECT auth_helper.is_staff())
    OR (SELECT auth_helper.is_active()) AND (SELECT auth_helper.account_id()) IN (SELECT auth_helper.requester_accounts(a.request_id));

-- The signed-in interpreter's requests (interpreter-web /requests): its line and the request,
-- without the private fields until accepted (they are in request_details for the accepted).
CREATE OR REPLACE VIEW booking.my_assignments WITH (security_invoker = false) AS
SELECT a.id, a.request_id, a.status, a.offered_price_aoa, a.offered_travel_fee_aoa, a.agreed_price_aoa,
       a.agreed_travel_fee_aoa, a.invite_expires_at, a.created_at,
       r.code, r.kind, r.status AS request_status, r.modality, r.starts_at, r.duration_minutes, r.city, r.is_urgent,
       s.title AS service_title, s.pricing_mode, r.ends_at
  FROM booking.request_assignments AS a
  JOIN booking.requests AS r ON r.id = a.request_id
  JOIN catalog.services AS s ON s.id = r.service_id
 WHERE a.interpreter_id = (SELECT auth_helper.account_id()) AND (SELECT auth_helper.is_active());

-- The log of a request as a timeline (R-REQ-11), with the actor's name.
-- An interpreter sees the request's own lines and its own, never another interpreter's (nor its
-- reason to decline).
CREATE OR REPLACE VIEW booking.request_timeline WITH (security_invoker = false) AS
SELECT e.id, e.request_id, e.assignment_id, e.from_status, e.to_status, e.actor_role, e.reason, e.at,
       (SELECT p.full_name FROM identity.profiles AS p WHERE p.id = e.actor_account) AS actor_name,
       (SELECT p.full_name FROM booking.request_assignments AS a JOIN identity.profiles AS p ON p.id = a.interpreter_id
         WHERE a.id = e.assignment_id) AS interpreter_name
  FROM booking.request_events AS e
 WHERE (SELECT auth_helper.can_view_request(e.request_id))
   AND (e.assignment_id IS NULL
        OR (SELECT auth_helper.is_staff())
        OR (SELECT auth_helper.account_id()) IN (SELECT auth_helper.requester_accounts(e.request_id))
        OR EXISTS (SELECT 1 FROM booking.request_assignments AS a
                    WHERE a.id = e.assignment_id AND a.interpreter_id = (SELECT auth_helper.account_id())));
