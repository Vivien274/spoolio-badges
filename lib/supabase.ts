import { createClient } from '@supabase/supabase-js'

// Serveur uniquement — ne jamais importer côté client
export function createServerClient() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Variables SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY manquantes')
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  })
}
