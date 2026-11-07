import { createClient } from '@supabase/supabase-js'
declare const supabase: { from(table: string): unknown }
export const rows = supabase.from('interpreters')
export const response = fetch('/api')
export { createClient }
