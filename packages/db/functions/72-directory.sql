-- The interpreter's profile and the directory (step H4; interpreter-profile-and-directory.md).
-- The rules live here, the screens read them: R-DIR-01 (complete), R-DIR-04 (who reads), R-DIR-07
-- (removal by the team). R-DIR-09 (eligibility) needs the requests and arrives with H5 (AD-033).

-- R-DIR-01, written once: what each profile still misses, as stable keys the screen turns into
-- links ('bio', 'modality', 'languages', 'services', 'city'); empty when complete. Not granted to
-- anyone: the functions and views below read it as their owner.
CREATE OR REPLACE VIEW directory.profile_status AS
SELECT i.account_id,
       array_remove(ARRAY[
         CASE WHEN length(trim(coalesce(i.bio, ''))) < 80 THEN 'bio' END,
         CASE WHEN i.modality IS NULL THEN 'modality' END,
         CASE WHEN NOT EXISTS (SELECT 1 FROM directory.interpreter_languages AS l WHERE l.interpreter_id = i.account_id)
              THEN 'languages' END,
         CASE WHEN NOT EXISTS (SELECT 1 FROM directory.interpreter_services AS s
                                 JOIN catalog.services AS c ON c.id = s.service_id
                                WHERE s.interpreter_id = i.account_id AND s.active AND c.active)
              THEN 'services' END,
         CASE WHEN i.modality IN ('in_person', 'both') AND length(trim(coalesce(i.city, ''))) = 0 THEN 'city' END
       ], NULL) AS missing
  FROM identity.interpreter_profiles AS i;

CREATE OR REPLACE FUNCTION directory.profile_missing(p_account uuid) RETURNS text[]
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$ SELECT s.missing FROM directory.profile_status AS s WHERE s.account_id = p_account $$;

CREATE OR REPLACE FUNCTION directory.is_profile_complete(p_account uuid) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$ SELECT coalesce(cardinality(directory.profile_missing(p_account)) = 0, false) $$;

-- R-DIR-03 and R-DIR-04 for the policies: who reads an interpreter's profile and its parts. The
-- owner and the team always; any active account when the interpreter is listed (complete profile,
-- active account; the verification is not a condition, D-41).
CREATE OR REPLACE FUNCTION auth_helper.can_read_interpreter(p_interpreter uuid) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$
  SELECT p_interpreter = auth_helper.account_id()
      OR auth_helper.is_staff()
      OR (auth_helper.is_active()
          AND auth_helper.account_status(p_interpreter) = 'active'
          AND directory.is_profile_complete(p_interpreter))
$$;

-- R-DIR-07: the team removes a video or an article with a reason; the author is told
-- (content_removed) and the removal is audited. The item stays, visible to its author and the team.
CREATE OR REPLACE FUNCTION directory.remove_content(p_actor uuid, p_kind text, p_id uuid, p_reason text)
RETURNS void
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_level text := identity.assert_staff(p_actor, ARRAY['moderator']);
  v_author uuid;
  v_title text;
  v_status text;
BEGIN
  IF length(trim(coalesce(p_reason, ''))) < 3 THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'VALIDATION_FAILED', HINT = 'reason:required';
  END IF;
  IF p_kind = 'video' THEN
    SELECT m.interpreter_id, m.title, m.status INTO v_author, v_title, v_status
      FROM directory.media_items AS m WHERE m.id = p_id FOR UPDATE;
  ELSIF p_kind = 'article' THEN
    SELECT a.interpreter_id, a.title, a.status INTO v_author, v_title, v_status
      FROM directory.articles AS a WHERE a.id = p_id FOR UPDATE;
  END IF;
  IF v_author IS NULL THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_FOUND'; END IF;
  IF v_status <> 'published' THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'STATE_CHANGED'; END IF;
  IF p_kind = 'video' THEN
    UPDATE directory.media_items
       SET status = 'removed', removed_by = p_actor, removed_reason = trim(p_reason), removed_at = util.now()
     WHERE id = p_id;
  ELSE
    UPDATE directory.articles
       SET status = 'removed', removed_by = p_actor, removed_reason = trim(p_reason), removed_at = util.now()
     WHERE id = p_id;
  END IF;
  PERFORM notify.enqueue('content_removed', v_author,
    jsonb_build_object('kind', p_kind, 'id', p_id, 'title', v_title, 'reason', trim(p_reason),
                       'app', 'interpreter', 'link', '/profile/content'));
  PERFORM audit.record(p_actor, v_level, 'content.removed', 'content', p_id::text,
    jsonb_build_object('kind', p_kind, 'status', 'published'),
    jsonb_build_object('kind', p_kind, 'status', 'removed', 'reason', trim(p_reason)));
END;
$$;
