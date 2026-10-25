-- audit.record: the one writer of audit.events (R-AUD-02). Called by the transition functions and
-- by the API audit plugin, which passes the request id and IP.
CREATE OR REPLACE FUNCTION audit.record(
  p_actor_account uuid,
  p_actor_role text,
  p_action text,
  p_entity_type text,
  p_entity_id text,
  p_before jsonb DEFAULT NULL,
  p_after jsonb DEFAULT NULL,
  p_request_id text DEFAULT NULL,
  p_ip inet DEFAULT NULL,
  p_note text DEFAULT NULL
) RETURNS bigint
  LANGUAGE sql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
  INSERT INTO audit.events (occurred_at, actor_account, actor_role, action, entity_type, entity_id,
                            before, after, request_id, ip, note)
  VALUES (util.now(), p_actor_account, p_actor_role, p_action, p_entity_type, p_entity_id,
          p_before, p_after, p_request_id, p_ip, p_note)
  RETURNING id
$$;
