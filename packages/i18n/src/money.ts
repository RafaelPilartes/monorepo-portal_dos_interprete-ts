// Kwanzas are whole numbers (D-37). Thousands are grouped with a no-break space
// so "14 040 Kz" never wraps between the digits and the currency.
const NO_BREAK_SPACE = ' '

/** 14040 -> "14 040 Kz" (no-break spaces). */
export function formatAoa(amount: number): string {
  if (!Number.isInteger(amount)) {
    throw new RangeError(`formatAoa expects whole kwanzas (D-37), got ${amount}`)
  }
  const sign = amount < 0 ? '-' : ''
  const digits = Math.abs(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, NO_BREAK_SPACE)
  return `${sign}${digits}${NO_BREAK_SPACE}Kz`
}
