/**
 * Migre les fiches WordPress (enfants + animaux) vers Supabase.
 * Les fichiers SQL doivent être placés dans migration/.
 *
 * Usage : npm run migrate:wp
 *
 * Idempotent : si le token existe déjà et que password_hash est défini
 * (fiche déjà activée dans Spoolio), la ligne est ignorée.
 * Si le token existe sans password_hash, les données sont mises à jour.
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { randomBytes } from 'crypto'
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌  SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis dans .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateClaimCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  const bytes = randomBytes(8)
  for (let i = 0; i < 8; i++) code += chars[bytes[i] % chars.length]
  return code
}

function stripTel(val: string | null): string | undefined {
  if (!val) return undefined
  const v = val.replace(/^tel:/, '').trim()
  return v || undefined
}

function nonempty(val: string | null): string | undefined {
  if (!val) return undefined
  const v = val.trim()
  return v || undefined
}

/** Extrait la valeur string d'un champ PHP sérialisé : a:1:{i:0;s:5:"Chien";} */
function unserializePhp(val: string | null): string | undefined {
  if (!val) return undefined
  const v = val.trim()
  if (!v.startsWith('a:')) return nonempty(v)
  const match = v.match(/s:\d+:"([^"]+)"/)
  return match ? match[1] : undefined
}

// ─── Parseur SQL INSERT ───────────────────────────────────────────────────────

/**
 * Extrait les colonnes et les lignes d'un INSERT INTO MySQL.
 * Gère les strings entre guillemets simples avec échappements (\', \\).
 */
function parseMySQLInsert(sql: string): { columns: string[]; rows: (string | null)[][] } {
  // Colonnes
  const colMatch = sql.match(/INSERT INTO `\w+` \(([^)]+)\) VALUES/)
  if (!colMatch) throw new Error('Impossible de trouver les colonnes dans le SQL.')
  const columns = colMatch[1].split(',').map((c) => c.trim().replace(/`/g, ''))

  // Bloc VALUES
  const valuesStart = sql.indexOf('VALUES\n')
  if (valuesStart === -1) throw new Error('Impossible de trouver VALUES dans le SQL.')
  const valuesBlock = sql.slice(valuesStart + 7)

  const rows: (string | null)[][] = []
  let i = 0

  while (i < valuesBlock.length) {
    // Chercher le début d'une ligne : '('
    while (i < valuesBlock.length && valuesBlock[i] !== '(') {
      if (valuesBlock[i] === ';') break
      i++
    }
    if (i >= valuesBlock.length || valuesBlock[i] === ';') break

    i++ // skip '('
    const row: (string | null)[] = []

    while (i < valuesBlock.length && valuesBlock[i] !== ')') {
      const ch = valuesBlock[i]

      if (ch === '\'') {
        // String entre guillemets simples
        i++
        let str = ''
        while (i < valuesBlock.length) {
          if (valuesBlock[i] === '\\') {
            i++
            if (valuesBlock[i] === '\'') str += '\''
            else if (valuesBlock[i] === '\\') str += '\\'
            else if (valuesBlock[i] === 'n') str += '\n'
            else if (valuesBlock[i] === 'r') str += '\r'
            else str += valuesBlock[i]
            i++
          } else if (valuesBlock[i] === '\'') {
            i++ // closing quote
            break
          } else {
            str += valuesBlock[i]
            i++
          }
        }
        row.push(str)
      } else if (valuesBlock.slice(i, i + 4) === 'NULL') {
        row.push(null)
        i += 4
      } else if (ch === ',' || ch === ' ' || ch === '\n' || ch === '\r' || ch === '\t') {
        i++
        continue
      } else {
        // Nombre ou autre valeur non-quotée
        let num = ''
        while (i < valuesBlock.length && valuesBlock[i] !== ',' && valuesBlock[i] !== ')') {
          num += valuesBlock[i]
          i++
        }
        row.push(num.trim())
      }

      // Sauter la virgule après la valeur
      if (i < valuesBlock.length && valuesBlock[i] === ',') i++
    }

    if (i < valuesBlock.length && valuesBlock[i] === ')') i++ // skip ')'
    rows.push(row)
  }

  return { columns, rows }
}

function rowToObj(columns: string[], row: (string | null)[]): Record<string, string | null> {
  const obj: Record<string, string | null> = {}
  columns.forEach((col, idx) => { obj[col] = row[idx] ?? null })
  return obj
}

// ─── Migration enfants ────────────────────────────────────────────────────────

async function migrateEnfants() {
  console.log('\n📂  Lecture de migration/enfants.sql…')
  const sql = readFileSync(resolve(process.cwd(), 'migration/enfants.sql'), 'utf-8')
  const { columns, rows } = parseMySQLInsert(sql)
  console.log(`    ${rows.length} lignes trouvées.`)

  let inserted = 0
  let updated = 0
  let skipped = 0
  let errors = 0

  for (const row of rows) {
    const r = rowToObj(columns, row)
    const token = r['public_token']
    if (!token) { errors++; continue }

    // Vérifier si le token existe déjà
    const { data: existing } = await supabase
      .from('fiches')
      .select('password_hash, claim_code')
      .eq('token', token)
      .single()

    if (existing?.password_hash) {
      console.log(`    ⏭  ${token} (${r['post_title']}) — déjà activé, ignoré.`)
      skipped++
      continue
    }

    const isClaimed = r['tag_active'] === '1'
    const claimCode = existing?.claim_code ?? generateClaimCode()

    const ficheData = {
      ref: nonempty(r['post_title']),
      email: nonempty(r['owner_email']),
      prenom: nonempty(r['prenom_enfant']),
      tel_parent_1: stripTel(r['telephone_parent_1_link']),
      tel_parent_2: stripTel(r['telephone_parent_2_link']),
      message: nonempty(r['message_personnalise']),
      medical: nonempty(r['allergies_infos_medicales']),
    }

    const { error } = await supabase.from('fiches').upsert(
      {
        token,
        type: 'enfant',
        is_claimed: isClaimed,
        claim_code: claimCode,
        password_hash: null,
        data: ficheData,
        failed_attempts: 0,
        locked_until: null,
      },
      { onConflict: 'token' }
    )

    if (error) {
      console.error(`    ❌  ${token} — ${error.message}`)
      errors++
    } else if (existing) {
      console.log(`    ✏️   ${token} (${r['post_title']}) — mis à jour.`)
      updated++
    } else {
      console.log(`    ✅  ${token} (${r['post_title']}) — inséré.`)
      inserted++
    }
  }

  console.log(`\n    Enfants : ${inserted} insérés, ${updated} mis à jour, ${skipped} ignorés, ${errors} erreurs.`)
}

// ─── Migration animaux ────────────────────────────────────────────────────────

async function migrateAnimaux() {
  console.log('\n📂  Lecture de migration/animaux.sql…')
  const sql = readFileSync(resolve(process.cwd(), 'migration/animaux.sql'), 'utf-8')
  const { columns, rows } = parseMySQLInsert(sql)
  console.log(`    ${rows.length} lignes trouvées.`)

  let inserted = 0
  let updated = 0
  let skipped = 0
  let errors = 0

  for (const row of rows) {
    const r = rowToObj(columns, row)
    const token = r['public_token']
    if (!token) { errors++; continue }

    const { data: existing } = await supabase
      .from('fiches')
      .select('password_hash, claim_code')
      .eq('token', token)
      .single()

    if (existing?.password_hash) {
      console.log(`    ⏭  ${token} (${r['post_title']}) — déjà activé, ignoré.`)
      skipped++
      continue
    }

    const isClaimed = r['tag_active'] === '1'
    const claimCode = existing?.claim_code ?? generateClaimCode()

    const ficheData = {
      ref: nonempty(r['post_title']),
      email: nonempty(r['owner_email']),
      nom: nonempty(r['pet_name']),
      type_animal: unserializePhp(r['pet_type']),
      race: nonempty(r['pet_breed']),
      tel_proprio_1: stripTel(r['owner_phone_1_link']),
      tel_proprio_2: stripTel(r['owner_phone_2_link']),
      medical: nonempty(r['pet_medical']),
      message: nonempty(r['pet_message']),
      veto_nom: nonempty(r['vet_name']),
      veto_adresse: nonempty(r['vet_address']),
    }

    const { error } = await supabase.from('fiches').upsert(
      {
        token,
        type: 'animal',
        is_claimed: isClaimed,
        claim_code: claimCode,
        password_hash: null,
        data: ficheData,
        failed_attempts: 0,
        locked_until: null,
      },
      { onConflict: 'token' }
    )

    if (error) {
      console.error(`    ❌  ${token} — ${error.message}`)
      errors++
    } else if (existing) {
      console.log(`    ✏️   ${token} (${r['post_title']}) — mis à jour.`)
      updated++
    } else {
      console.log(`    ✅  ${token} (${r['post_title']}) — inséré.`)
      inserted++
    }
  }

  console.log(`\n    Animaux : ${inserted} insérés, ${updated} mis à jour, ${skipped} ignorés, ${errors} erreurs.`)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀  Migration WordPress → Supabase')
  console.log('   ⚠️  Règle absolue : les tokens NFC ne sont JAMAIS régénérés.\n')

  await migrateEnfants()
  await migrateAnimaux()

  console.log('\n✅  Migration terminée.')
}

main().catch((err) => {
  console.error('❌  Erreur fatale :', err)
  process.exit(1)
})
