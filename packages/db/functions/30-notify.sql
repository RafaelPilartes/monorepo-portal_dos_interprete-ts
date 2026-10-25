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
