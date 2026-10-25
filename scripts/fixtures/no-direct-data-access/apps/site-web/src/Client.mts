import { createClient } from '@supabase/supabase-js'
export const lazy = () => import('@supabase/postgrest-js')
export { createClient }
