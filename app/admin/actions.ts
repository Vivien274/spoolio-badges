'use server'

import { redirect } from 'next/navigation'
import { randomBytes } from 'crypto'
import { createServerClient } from '@/lib/supabase'
import { setAdminSession, getAdminSession, clearAdminSession } from '@/lib/admin-session'
import type { ActionState } from '@/lib/types'

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function adminLogin(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const password = formData.get('password') as string
  if (!password) return { error: 'Mot de passe requis.' }

  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return { error: 'ADMIN_PASSWORD non configuré.' }
  if (password !== expected) return { error: 'Mot de passe incorrect.' }

  await setAdminSession()
  redirect('/admin/dashboard')
}

export async function adminLogout(): Promise<void> {
  await clearAdminSession()
  redirect('/admin')
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateToken(): string {
  return randomBytes(18).toString('base64url')
}

function generateClaimCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = randomBytes(8)
  return Array.from(bytes, (b) => chars[b % chars.length]).join('')
}

// ─── Fiches ──────────────────────────────────────────────────────────────────

export interface GeneratedFiche {
  token: string
  claim_code: string
}

export interface GenerateResult {
  error?: string
  fiches?: GeneratedFiche[]
}

export async function generateFiches(_prev: GenerateResult, formData: FormData): Promise<GenerateResult> {
  const authenticated = await getAdminSession()
  if (!authenticated) return { error: 'Session expirée.' }

  const raw = formData.get('count') as string
  const count = Math.min(Math.max(parseInt(raw, 10) || 1, 1), 100)
  const type = formData.get('type') as string || 'festivalier'
  const validTypes = ['festivalier', 'enfant', 'animal']
  const ficheType = validTypes.includes(type) ? type : 'festivalier'

  const rows = Array.from({ length: count }, () => ({
    token: generateToken(),
    claim_code: generateClaimCode(),
    type: ficheType,
    is_claimed: false,
    data: {},
  }))

  const supabase = createServerClient()
  const { error } = await supabase.from('fiches').insert(rows)
  if (error) return { error: 'Erreur lors de la création des fiches.' }

  return { fiches: rows.map(({ token, claim_code }) => ({ token, claim_code })) }
}

export async function adminDeleteFiche(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const authenticated = await getAdminSession()
  if (!authenticated) return { error: 'Session expirée.' }

  const token = formData.get('token') as string
  if (!token) return { error: 'Token manquant.' }

  const supabase = createServerClient()

  // Supprimer la photo si elle existe
  const { data } = await supabase.from('fiches').select('data').eq('token', token).single()
  const photoPath = (data?.data as Record<string, unknown> | null)?.photo_path as string | undefined
  if (photoPath) {
    await supabase.storage.from('badge-photos').remove([photoPath])
  }

  const { error } = await supabase.from('fiches').delete().eq('token', token)
  if (error) return { error: 'Erreur lors de la suppression.' }
  return { success: true }
}
