-- audit.record: the one writer of audit.events (R-AUD-02). Called by the transition functions and
-- by the API audit plugin, which passes the request id and IP. The time is the real clock
-- (pg_catalog.now()), never the test clock: the trail records when things happened.
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
  VALUES (pg_catalog.now(), p_actor_account, p_actor_role, p_action, p_entity_type, p_entity_id,
          p_before, p_after,
          -- The API puts the request id and the client IP in the transaction (lib/db.ts), so the
          -- transition functions record them without passing them along.
          coalesce(p_request_id, nullif(pg_catalog.current_setting('app.request_id', true), '')),
          coalesce(p_ip, nullif(pg_catalog.current_setting('app.client_ip', true), '')::inet),
          p_note)
  RETURNING id
$$;

-- Audit areas (R-AUD-03) ------------------------------------------------------------------------

-- The R-STF-01 area of an audit entry, from its entity type. Feature steps add their types here.
CREATE OR REPLACE FUNCTION audit.area_of(p_entity_type text) RETURNS text
  LANGUAGE sql IMMUTABLE
  SET search_path = ''
AS $$
  SELECT CASE
    WHEN p_entity_type IN ('staff_member') THEN 'team'
    WHEN p_entity_type IN ('platform_version', 'legal_document') THEN 'configuration'
    WHEN p_entity_type IN ('document_type', 'language', 'specialty', 'service') THEN 'catalogs'
    WHEN p_entity_type IN ('verification_document', 'verification_request', 'badge') THEN 'verifications'
    WHEN p_entity_type IN ('payment_proof', 'payment_intent', 'refund', 'payout', 'receipt', 'export') THEN 'payments'
    WHEN p_entity_type IN ('chat_attachment', 'thread') THEN 'conversations'
    WHEN p_entity_type IN ('request', 'assignment', 'dispute') THEN 'requests'
    WHEN p_entity_type IN ('account', 'organization') THEN 'accounts'
    WHEN p_entity_type IN ('content', 'review', 'report') THEN 'content'
    WHEN p_entity_type IN ('ticket', 'contact_message') THEN 'support'
    ELSE 'other'
  END
$$;

-- Which areas each level sees in the audit (the R-STF-01 matrix, "as suas áreas"); super_admin
-- sees everything, 'team', 'configuration' and 'other' only super_admin.
CREATE OR REPLACE FUNCTION audit.level_sees(p_level text, p_area text) RETURNS boolean
  LANGUAGE sql IMMUTABLE
  SET search_path = ''
AS $$
  SELECT CASE p_level
    WHEN 'super_admin' THEN true
    WHEN 'moderator' THEN p_area IN ('catalogs', 'verifications', 'requests', 'conversations', 'accounts', 'content', 'support')
    WHEN 'finance' THEN p_area IN ('payments', 'accounts', 'requests', 'support')
    WHEN 'request_operator' THEN p_area IN ('requests', 'conversations', 'accounts', 'support')
    ELSE false
  END
$$;

-- R-AUD-03: whether the caller's level sees an audit entry of this entity type.
CREATE OR REPLACE FUNCTION auth_helper.sees_audit_entry(p_entity_type text) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$ SELECT coalesce(audit.level_sees(auth_helper.staff_level(), audit.area_of(p_entity_type)), false) $$;

-- The area of an entry, for the audit screen (audit.events_for_staff runs as the caller).
CREATE OR REPLACE FUNCTION auth_helper.audit_area(p_entity_type text) RETURNS text
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$ SELECT audit.area_of(p_entity_type) $$;
