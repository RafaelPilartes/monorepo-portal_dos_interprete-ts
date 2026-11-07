export function total(rows: { price_aoa: number; travel_fee_aoa: number }[], hours: number): number {
  const first = rows[0]!.price_aoa * hours
  return first + rows[0]!.travel_fee_aoa
}
