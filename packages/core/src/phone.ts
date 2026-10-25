import { PHONE_E164_PATTERN } from './patterns'

const ANGOLA_COUNTRY_CODE = '244'

/**
 * Normalises a phone number to E.164 once, before sending (data-model.md §1:
 * "923000000" -> "+244923000000"). Returns null when the result is not a valid
 * E.164 number; the database only checks, it never normalises.
 */
export function normalizePhone(input: string): string | null {
  const compact = input.replace(/[\s().-]/g, '')
  let candidate: string
  if (compact.startsWith('+')) {
    candidate = compact
  } else if (compact.startsWith('00')) {
    candidate = `+${compact.slice(2)}`
  } else if (/^9[0-9]{8}$/.test(compact)) {
    // A nine-digit number starting with 9 is an Angolan mobile without the country code.
    candidate = `+${ANGOLA_COUNTRY_CODE}${compact}`
  } else {
    candidate = `+${compact}`
  }
  return PHONE_E164_PATTERN.test(candidate) ? candidate : null
}
