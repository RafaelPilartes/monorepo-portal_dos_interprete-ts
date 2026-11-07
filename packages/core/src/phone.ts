import { PHONE_E164_PATTERN } from './patterns'

const ANGOLA_COUNTRY_CODE = '244'

/**
 * Normalises a phone number to E.164 once, before sending (data-model.md §1:
 * "923000000" -> "+244923000000"). An Angolan national number has 9 digits and
 * starts with 9 (mobile) or 2 (fixed); anything else must be written with its
 * country code (+ or 00). Returns null when that is not a valid E.164 number,
 * instead of guessing a country (AD-020).
 */
export function normalizePhone(input: string): string | null {
  const compact = input.replace(/[\s().-]/g, '')
  let candidate: string
  if (compact.startsWith('+')) {
    candidate = compact
  } else if (compact.startsWith('00')) {
    candidate = `+${compact.slice(2)}`
  } else if (/^[29][0-9]{8}$/.test(compact)) {
    candidate = `+${ANGOLA_COUNTRY_CODE}${compact}`
  } else {
    return null
  }
  return PHONE_E164_PATTERN.test(candidate) ? candidate : null
}
