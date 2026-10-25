BEGIN;
CREATE DOMAIN util.phone_e164 AS text CHECK (VALUE ~ '^\+[1-9][0-9]{7,14}$');
CREATE DOMAIN util.nif AS text CHECK (VALUE ~ '^[0-9A-Z]{9,14}$');
CREATE DOMAIN util.iban_ao AS text CHECK (VALUE ~ '^AO06[0-9]{21}$');
COMMIT;
