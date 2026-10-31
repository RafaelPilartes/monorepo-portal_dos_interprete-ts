-- What the visitor sees of the directory (R-DIR-04, D-05): name, photo, city, languages,
-- specialties, modality, badge and rating. No contacts, no biography, no prices. It runs as its
-- owner and shows only the listed interpreters (R-DIR-03), to anyone, signed in or not. The badge
-- (H12) and the rating (R-DIR-05, with the reviews) are fixed values until their steps redefine
-- the view keeping these columns (AD-033).
CREATE OR REPLACE VIEW directory.public_listing WITH (security_invoker = false) AS
SELECT i.account_id, i.slug, p.full_name, p.avatar_path, i.city, i.modality,
       coalesce((SELECT array_agg(c.name ORDER BY c.sort, c.name) FROM directory.interpreter_languages AS l
                   JOIN catalog.languages AS c ON c.id = l.language_id WHERE l.interpreter_id = i.account_id), '{}') AS language_names,
       coalesce((SELECT array_agg(l.language_id) FROM directory.interpreter_languages AS l
                  WHERE l.interpreter_id = i.account_id), '{}') AS language_ids,
       coalesce((SELECT array_agg(c.name ORDER BY c.sort, c.name) FROM directory.interpreter_specialties AS s
                   JOIN catalog.specialties AS c ON c.id = s.specialty_id WHERE s.interpreter_id = i.account_id), '{}') AS specialty_names,
       coalesce((SELECT array_agg(s.specialty_id) FROM directory.interpreter_specialties AS s
                  WHERE s.interpreter_id = i.account_id), '{}') AS specialty_ids,
       false AS is_verified,
       NULL::numeric AS rating_average,
       0 AS rating_count
  FROM identity.interpreter_profiles AS i
  JOIN identity.profiles AS p ON p.id = i.account_id
  JOIN directory.profile_status AS ps ON ps.account_id = i.account_id
 WHERE p.status = 'active' AND cardinality(ps.missing) = 0;

-- The signed-in interpreter's own status (R-DIR-01): what is missing, read by /profile.
CREATE OR REPLACE VIEW directory.my_profile_status WITH (security_invoker = false) AS
SELECT s.account_id, s.missing, cardinality(s.missing) = 0 AS is_complete
  FROM directory.profile_status AS s
 WHERE s.account_id = (SELECT auth_helper.account_id());
