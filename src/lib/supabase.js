import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
export const supabaseImageBucket = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET ?? 'cocktail-images'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)