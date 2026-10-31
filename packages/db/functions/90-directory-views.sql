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
  JOIN directory.listed_ids AS l ON l.account_id = i.account_id;

-- The signed-in interpreter's own status (R-DIR-01): what is missing, read by /profile.
CREATE OR REPLACE VIEW directory.my_profile_status WITH (security_invoker = false) AS
SELECT s.account_id, s.missing, cardinality(s.missing) = 0 AS is_complete, r.bio_min_length
  FROM directory.profile_status AS s
 CROSS JOIN directory.profile_rules AS r
 WHERE s.account_id = (SELECT auth_helper.account_id());

-- The languages, specialties and services of an interpreter with their catalog names, items
-- disabled in the catalog included: they stay on the profile (interpreter-profile-and-directory.md,
-- "Casos-limite"), while the catalog itself shows only active items. Rows of the interpreters the
-- caller may read (R-DIR-04).
CREATE OR REPLACE VIEW directory.profile_items WITH (security_invoker = false) AS
SELECT l.interpreter_id, 'language'::text AS kind, l.language_id AS item_id, NULL::uuid AS link_id, c.name,
       l.level, c.is_sign_language, NULL::text AS pricing_mode, NULL::bigint AS price_aoa, NULL::text AS description,
       true AS link_active, c.active AS catalog_active, c.sort
  FROM directory.interpreter_languages AS l JOIN catalog.languages AS c ON c.id = l.language_id
 WHERE (SELECT auth_helper.can_read_interpreter(l.interpreter_id))
UNION ALL
SELECT s.interpreter_id, 'specialty', s.specialty_id, NULL, c.name, NULL, false, NULL, NULL, NULL, true, c.active, c.sort
  FROM directory.interpreter_specialties AS s JOIN catalog.specialties AS c ON c.id = s.specialty_id
 WHERE (SELECT auth_helper.can_read_interpreter(s.interpreter_id))
UNION ALL
SELECT s.interpreter_id, 'service', s.service_id, s.id, c.title, NULL, false, c.pricing_mode, s.price_aoa, s.description,
       s.active, c.active, c.sort
  FROM directory.interpreter_services AS s JOIN catalog.services AS c ON c.id = s.service_id
 WHERE (SELECT auth_helper.can_read_interpreter(s.interpreter_id));
