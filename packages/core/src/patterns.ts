// Validation patterns shared with the database domains (data-model.md §1, R-CFG-05).
// The SQL domains util.phone_e164, util.nif and util.iban_ao use the same
// expressions; verify.py compares them once the migration exists (step F).

/** util.phone_e164 */
export const PHONE_E164_PATTERN = /^\+[1-9][0-9]{7,14}$/

/** util.nif — provisional format: company NIF (10 digits) or the BI-based personal one. */
export const NIF_PATTERN = /^[0-9A-Z]{9,14}$/

/** util.iban_ao — an Angolan IBAN starts with AO06 and has 25 characters. */
export const IBAN_AO_PATTERN = /^AO06[0-9]{21}$/

/** Pragmatic email shape; the authoritative check is the confirmation email (D-04). */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
