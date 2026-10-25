// Deliberate violations: a screen talking to Supabase or the network directly.
declare const supabase: { from(table: string): unknown; rpc(name: string): unknown }
const glob = 'assets/*'
export const rows = supabase.from('interpreters')
export const viaWindow = window.fetch('/a')
export const viaGlobal = globalThis.fetch('/b')
/* a comment after the string that once hid violations */
export const plain = fetch('/c')
export const call = supabase.rpc('x')
export { glob }
