// Deliberate violation: a screen calling Supabase and fetch directly.
declare const supabase: { from(table: string): unknown }
export const rows = supabase.from('interpreters')
export const response = fetch('/api/interpreters')
