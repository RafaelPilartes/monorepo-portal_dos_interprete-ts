-- Who may upload or read a private file (api.md §6). The API asks this before signing a URL; the
-- same function decides writing and reading, per purpose. Each purpose's function answers false
-- until the step that owns it fills it in (payments H7, verification H10, chat H4, support H15).
-- EXECUTE for service_role only.

CREATE OR REPLACE FUNCTION util.can_access_payment_proof(p_account uuid, p_subject uuid, p_mode text) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$ SELECT false $$;

CREATE OR REPLACE FUNCTION util.can_access_verification_document(p_account uuid, p_subject uuid, p_mode text) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$ SELECT false $$;

CREATE OR REPLACE FUNCTION util.can_access_chat_attachment(p_account uuid, p_subject uuid, p_mode text) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$ SELECT false $$;

CREATE OR REPLACE FUNCTION util.can_access_ticket_attachment(p_account uuid, p_subject uuid, p_mode text) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$ SELECT false $$;

-- p_mode is 'write' (sign an upload) or 'read' (sign a download). An unknown purpose or mode is
-- refused, never allowed.
CREATE OR REPLACE FUNCTION util.can_access_file(p_account uuid, p_purpose text, p_subject uuid, p_mode text)
RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$
  SELECT CASE
    WHEN p_account IS NULL OR p_subject IS NULL OR p_mode NOT IN ('write', 'read') THEN false
    WHEN p_purpose = 'payment_proof' THEN util.can_access_payment_proof(p_account, p_subject, p_mode)
    WHEN p_purpose = 'verification_document' THEN util.can_access_verification_document(p_account, p_subject, p_mode)
    WHEN p_purpose = 'chat_attachment' THEN util.can_access_chat_attachment(p_account, p_subject, p_mode)
    WHEN p_purpose = 'ticket_attachment' THEN util.can_access_ticket_attachment(p_account, p_subject, p_mode)
    ELSE false
  END
$$;
