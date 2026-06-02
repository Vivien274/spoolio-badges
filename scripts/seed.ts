/**
 * Génère une fiche de test et l'insère dans Supabase.
 * Usage : npm run seed
 * Nécessite un fichier .env.local avec SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.
 */

import { randomBytes } from 'crypto'
import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Charger .env.local depuis la racine du projet
config({ path: resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌  Variables manquantes : SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis dans .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

function generateToken(): string {
  // ~24 chars url-safe, indevinable
  return randomBytes(18).toString('base64url')
}

function generateClaimCode(): string {
  // 8 chars sans ambiguïtés (0/O, 1/I/l)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = randomBytes(8)
  return Array.from(bytes, (b) => chars[b % chars.length]).join('')
}

async function seed() {
  const token = generateToken()
  const claimCode = generateClaimCode()

  const { error } = await supabase.from('fiches').insert({
    token,
    claim_code: claimCode,
    is_claimed: false,
    data: {},
  })

  if (error) {
    console.error('❌  Erreur Supabase :', error.message)
    process.exit(1)
  }

  console.log('\n✅  Fiche de test créée !\n')
  console.log(`  URL NFC     : https://badge.spoolio.fr/${token}`)
  console.log(`  Page edit   : https://badge.spoolio.fr/${token}/edit`)
  console.log(`  Claim code  : ${claimCode}`)
  console.log('\n  (en local)')
  console.log(`  URL NFC     : http://localhost:3000/${token}`)
  console.log(`  Page edit   : http://localhost:3000/${token}/edit\n`)
}

seed()
