import { z } from 'zod'
import { catalogMessage } from './errors'
import { normalizePhone } from './phone'
import { EMAIL_PATTERN, IBAN_AO_PATTERN, NIF_PATTERN } from './patterns'

// Shared form schemas. Every message comes from the error catalog (api.md §2),
// so the form and the API say the same thing (one rule, one place).

const INVALID_INPUT = catalogMessage('VALIDATION_FAILED')

export const emailSchema = z
  .string({ invalid_type_error: INVALID_INPUT, required_error: INVALID_INPUT })
  .trim()
  .regex(EMAIL_PATTERN, INVALID_INPUT)

/** Accepts the usual ways of writing a phone and outputs E.164. */
export const phoneSchema = z
  .string({ invalid_type_error: catalogMessage('INVALID_PHONE'), required_error: catalogMessage('INVALID_PHONE') })
  .transform((value, context) => {
    const normalized = normalizePhone(value)
    if (normalized === null) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: catalogMessage('INVALID_PHONE') })
      return z.NEVER
    }
    return normalized
  })

export const nifSchema = z
  .string({ invalid_type_error: catalogMessage('INVALID_NIF'), required_error: catalogMessage('INVALID_NIF') })
  .trim()
  .transform((value) => value.toUpperCase())
  .pipe(z.string().regex(NIF_PATTERN, catalogMessage('INVALID_NIF')))

export const ibanAoSchema = z
  .string({ invalid_type_error: catalogMessage('INVALID_IBAN'), required_error: catalogMessage('INVALID_IBAN') })
  .transform((value) => value.replace(/\s/g, '').toUpperCase())
  .pipe(z.string().regex(IBAN_AO_PATTERN, catalogMessage('INVALID_IBAN')))

/** A price or amount someone types: whole kwanzas (D-37), greater than zero (INVALID_AMOUNT). */
export const amountAoaSchema = z
  .number({ invalid_type_error: catalogMessage('INVALID_AMOUNT'), required_error: catalogMessage('INVALID_AMOUNT') })
  .int(catalogMessage('INVALID_AMOUNT'))
  .positive(catalogMessage('INVALID_AMOUNT'))
  .max(Number.MAX_SAFE_INTEGER, catalogMessage('INVALID_AMOUNT'))
