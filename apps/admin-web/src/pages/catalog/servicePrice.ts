import { formatAoa } from '@portal-dos-interpretes/i18n'
import type { ServiceRow } from '@/data/repositories'

/** "15 000 Kz por hora" or "25 000 Kz (fixo)" (catalogs.md). */
export function servicePrice(row: Pick<ServiceRow, 'platform_price_aoa' | 'pricing_mode'>): string {
  const amount = formatAoa(Number(row.platform_price_aoa ?? 0))
  return row.pricing_mode === 'hourly' ? `${amount} por hora` : `${amount} (fixo)`
}
