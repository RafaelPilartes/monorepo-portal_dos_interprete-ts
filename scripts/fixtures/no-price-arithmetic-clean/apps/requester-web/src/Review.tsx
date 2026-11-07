// The total comes from POST /requests/preview; the screen only shows it.
export function label(preview: { total_aoa: number }, count: number): string {
  return `${preview.total_aoa} Kz para ${count + 1} pessoas`
}
