import { z } from 'zod'
import { normalizePhone } from './phone'
import { EMAIL_PATTERN, IBAN_AO_PATTERN, NIF_PATTERN } from './patterns'

// Shared form schemas. Messages are what the user reads (Portuguese, D-84).

export const emailSchema = z.string().trim().regex(EMAIL_PATTERN, 'Email inválido.')

/** Accepts any common way of writing a phone and outputs E.164. */
export const phoneSchema = z
  .string()
  .transform((value, context) => {
    const normalized = normalizePhone(value)
    if (normalized === null) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: 'Telefone inválido.' })
      return z.NEVER
    }
    return normalized
  })

export const nifSchema = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase())
  .pipe(z.string().regex(NIF_PATTERN, 'NIF inválido.'))

export const ibanAoSchema = z
  .string()
  .transform((value) => value.replace(/\s/g, '').toUpperCase())
  .pipe(z.string().regex(IBAN_AO_PATTERN, 'IBAN inválido. Um IBAN angolano começa por AO06 e tem 25 caracteres.'))

/** Kwanzas are whole numbers (D-37). */
export const amountAoaSchema = z.number().int('O valor tem de ser em kwanzas inteiros.').nonnegative()
