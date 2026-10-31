-- notify: the only doors into notify.notifications and notify.email_outbox (R-NOT-02).
-- Called inside the transaction of the change that justifies the notice, so a failed change
-- sends nothing.

-- A notice for an account: a portal row and/or an email, by the channels of its kind (R-NOT-01).
-- Returns the portal notification id, or NULL for an email-only kind. Service notices ignore
-- preferences (R-NOT-04).
CREATE OR REPLACE FUNCTION notify.enqueue(p_kind text, p_account uuid, p_payload jsonb DEFAULT '{}')
RETURNS uuid
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_channels text[];
  v_email text;
  v_id uuid;
BEGIN
  SELECT k.channels INTO v_channels FROM notify.kinds AS k WHERE k.code = p_kind;
  IF v_channels IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INTERNAL_ERROR',
      DETAIL = format('notification kind %L is not in notify.kinds', p_kind);
  END IF;

  IF 'portal' = ANY (v_channels) THEN
    INSERT INTO notify.notifications (account_id, kind, payload, link)
    VALUES (p_account, p_kind, p_payload, p_payload ->> 'link')
    RETURNING id INTO v_id;
  END IF;

  IF 'email' = ANY (v_channels) THEN
    SELECT u.email INTO v_email FROM auth.users AS u WHERE u.id = p_account;
    IF v_email IS NULL THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INTERNAL_ERROR',
        DETAIL = format('account %s has no email for notification kind %L', p_account, p_kind);
    END IF;
    INSERT INTO notify.email_outbox (account_id, to_email, template, payload)
    VALUES (p_account, v_email, p_kind, p_payload);
  END IF;

  RETURN v_id;
END;
$$;

-- An email for someone without an account (organisation invite, contact form): only the outbox.
CREATE OR REPLACE FUNCTION notify.enqueue_email(p_kind text, p_email text, p_payload jsonb DEFAULT '{}')
RETURNS uuid
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM notify.kinds AS k WHERE k.code = p_kind AND 'email' = ANY (k.channels)) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INTERNAL_ERROR',
      DETAIL = format('notification kind %L has no email channel', p_kind);
  END IF;
  INSERT INTO notify.email_outbox (to_email, template, payload)
  VALUES (p_email, p_kind, p_payload)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- The email worker's state machine (api.md §15, R-NOT-03). The API worker only renders and sends.
-- Claims up to p_limit due emails: queued and due, or still `sending` 15 minutes after being
-- claimed (a worker that died mid-send). The claim is a lease: next_attempt_at becomes its end.
-- FOR UPDATE SKIP LOCKED: two workers never take the same row.
CREATE OR REPLACE FUNCTION notify.claim_emails(p_limit integer)
RETURNS TABLE (id uuid, to_email text, template text, payload jsonb, attempts integer)
  LANGUAGE sql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
  WITH due AS (
    SELECT e.id
      FROM notify.email_outbox AS e
     WHERE e.status IN ('queued', 'sending') AND e.next_attempt_at <= util.now()
     ORDER BY e.next_attempt_at
     LIMIT greatest(least(p_limit, 100), 0)
       FOR UPDATE SKIP LOCKED
  )
  UPDATE notify.email_outbox AS e
     SET status = 'sending', attempts = e.attempts + 1, next_attempt_at = util.now() + interval '15 minutes'
    FROM due
   WHERE e.id = due.id
  RETURNING e.id, e.to_email::text, e.template, e.payload, e.attempts
$$;

CREATE OR REPLACE FUNCTION notify.mark_email_sent(p_id uuid) RETURNS void
  LANGUAGE sql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
  UPDATE notify.email_outbox
     SET status = 'sent', sent_at = util.now(), last_error = NULL
   WHERE id = p_id AND status = 'sending'
$$;

-- Retries 1, 5 and 30 minutes after the first, second and third failures; `failed` at the fourth.
CREATE OR REPLACE FUNCTION notify.mark_email_failed(p_id uuid, p_error text) RETURNS void
  LANGUAGE sql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
  UPDATE notify.email_outbox
     SET status = CASE WHEN attempts >= 4 THEN 'failed' ELSE 'queued' END,
         next_attempt_at = util.now() + CASE attempts WHEN 1 THEN interval '1 minute'
                                                      WHEN 2 THEN interval '5 minutes'
                                                      ELSE interval '30 minutes' END,
         last_error = left(p_error, 500)
   WHERE id = p_id AND status = 'sending'
$$;
