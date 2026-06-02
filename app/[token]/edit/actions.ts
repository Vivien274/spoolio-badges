'use server'

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import { setEditSession, getEditSession } from '@/lib/session'
import bcrypt from 'bcryptjs'
import type { ActionState, FicheData } from '@/lib/types'

const SALT_ROUNDS = 12
const MAX_ATTEMPTS = 5
const LOCKOUT_MINUTES = 15
const PHOTO_BUCKET = 'badge-photos'
const PHOTO_MAX_BYTES = 5 * 1024 * 1024

// ─── Rate limiting (stocké en base pour survivre au serverless) ───────────────

async function checkLock(token: string): Promise<{ locked: boolean; minutesLeft?: number }> {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('fiches')
    .select('locked_until')
    .eq('token', token)
    .single()

  if (data?.locked_until && new Date(data.locked_until) > new Date()) {
    const minutesLeft = Math.ceil((new Date(data.locked_until).getTime() - Date.now()) / 60_000)
    return { locked: true, minutesLeft }
  }
  return { locked: false }
}

async function recordFailure(token: string): Promise<void> {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('fiches')
    .select('failed_attempts')
    .eq('token', token)
    .single()

  const count = (data?.failed_attempts ?? 0) + 1
  const update: Record<string, unknown> = { failed_attempts: count }

  if (count >= MAX_ATTEMPTS) {
    update.locked_until = new Date(Date.now() + LOCKOUT_MINUTES * 60_000).toISOString()
    update.failed_attempts = 0
  }

  await supabase.from('fiches').update(update).eq('token', token)
}

async function resetLock(token: string): Promise<void> {
  const supabase = createServerClient()
  await supabase.from('fiches').update({ failed_attempts: 0, locked_until: null }).eq('token', token)
}

// ─── Photo ───────────────────────────────────────────────────────────────────

async function uploadPhoto(
  token: string,
  file: File
): Promise<{ url: string; path: string } | { error: string }> {
  if (!file.type.startsWith('image/')) return { error: 'Le fichier doit être une image.' }
  if (file.size > PHOTO_MAX_BYTES) return { error: 'La photo ne doit pas dépasser 5 Mo.' }

  const buffer = Buffer.from(await file.arrayBuffer())
  const supabase = createServerClient()

  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(token, buffer, { contentType: file.type, upsert: true })

  if (error) return { error: "Erreur lors de l'upload de la photo." }

  const { data } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(token)
  return { url: data.publicUrl, path: token }
}

async function deletePhoto(path: string): Promise<void> {
  const supabase = createServerClient()
  await supabase.storage.from(PHOTO_BUCKET).remove([path])
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractFicheData(formData: FormData): FicheData {
  return {
    prenom: (formData.get('prenom') as string)?.trim() || undefined,
    intro: (formData.get('intro') as string)?.trim() || undefined,
    contact1_nom: (formData.get('contact1_nom') as string)?.trim() || undefined,
    contact1_tel: (formData.get('contact1_tel') as string)?.trim() || undefined,
    contact2_nom: (formData.get('contact2_nom') as string)?.trim() || undefined,
    contact2_tel: (formData.get('contact2_tel') as string)?.trim() || undefined,
    infos_medicales: (formData.get('infos_medicales') as string)?.trim() || undefined,
    groupe_sanguin: (formData.get('groupe_sanguin') as string)?.trim() || undefined,
    camping: (formData.get('camping') as string)?.trim() || undefined,
    langues: (formData.get('langues') as string)?.trim() || undefined,
    message: (formData.get('message') as string)?.trim() || undefined,
  }
}

// ─── Actions publiques ────────────────────────────────────────────────────────

/** Activation initiale : vérifie le claim_code, hash le mdp, remplit la fiche */
export async function claimFiche(
  token: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const claimCode = (formData.get('claim_code') as string)?.trim()
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirm_password') as string

  if (!claimCode) return { error: 'Code de revendication requis.' }
  if (!password || password.length < 8) return { error: 'Le mot de passe doit faire au moins 8 caractères.' }
  if (password !== confirmPassword) return { error: 'Les mots de passe ne correspondent pas.' }

  const ficheData = extractFicheData(formData)
  if (!ficheData.prenom) return { error: 'Le prénom ou surnom est requis.' }
  if (!ficheData.contact1_nom) return { error: 'Le nom du contact 1 est requis.' }
  if (!ficheData.contact1_tel) return { error: 'Le téléphone du contact 1 est requis.' }

  const { locked, minutesLeft } = await checkLock(token)
  if (locked) return { error: `Trop de tentatives. Réessaie dans ${minutesLeft} min.` }

  const supabase = createServerClient()
  const { data: fiche, error } = await supabase
    .from('fiches')
    .select('claim_code, is_claimed')
    .eq('token', token)
    .single()

  if (error || !fiche) return { error: 'Fiche introuvable.' }
  if (fiche.is_claimed) return { error: 'Cette fiche est déjà activée.' }

  if (fiche.claim_code !== claimCode) {
    await recordFailure(token)
    return { error: 'Code de revendication incorrect.' }
  }

  // Photo optionnelle
  const photoFile = formData.get('photo') as File | null
  if (photoFile && photoFile.size > 0) {
    const result = await uploadPhoto(token, photoFile)
    if ('error' in result) return { error: result.error }
    ficheData.photo_url = result.url
    ficheData.photo_path = result.path
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

  const { error: updateError } = await supabase
    .from('fiches')
    .update({
      is_claimed: true,
      claim_code: null,
      password_hash: passwordHash,
      data: ficheData,
      failed_attempts: 0,
      locked_until: null,
    })
    .eq('token', token)

  if (updateError) return { error: "Erreur lors de l'activation. Réessaie." }

  await setEditSession(token)
  redirect(`/${token}`)
}

/** Vérification du mot de passe pour une fiche déjà revendiquée */
export async function verifyPassword(
  token: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const password = formData.get('password') as string
  if (!password) return { error: 'Mot de passe requis.' }

  const { locked, minutesLeft } = await checkLock(token)
  if (locked) return { error: `Trop de tentatives. Réessaie dans ${minutesLeft} min.` }

  const supabase = createServerClient()
  const { data: fiche } = await supabase
    .from('fiches')
    .select('password_hash')
    .eq('token', token)
    .single()

  if (!fiche?.password_hash) return { error: 'Fiche introuvable.' }

  const valid = await bcrypt.compare(password, fiche.password_hash)
  if (!valid) {
    await recordFailure(token)
    return { error: 'Mot de passe incorrect.' }
  }

  await resetLock(token)
  await setEditSession(token)
  redirect(`/${token}/edit`)
}

/** Mise à jour des données de la fiche (session requise) */
export async function updateFiche(
  token: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const authenticated = await getEditSession(token)
  if (!authenticated) return { error: 'Session expirée. Veuillez vous reconnecter.' }

  const ficheData = extractFicheData(formData)
  if (!ficheData.prenom) return { error: 'Le prénom ou surnom est requis.' }
  if (!ficheData.contact1_nom) return { error: 'Le nom du contact 1 est requis.' }
  if (!ficheData.contact1_tel) return { error: 'Le téléphone du contact 1 est requis.' }

  // Conserver la photo existante si pas de nouvelle
  const supabase = createServerClient()
  const { data: existing } = await supabase
    .from('fiches')
    .select('data')
    .eq('token', token)
    .single()

  if (existing?.data?.photo_url) {
    ficheData.photo_url = existing.data.photo_url
    ficheData.photo_path = existing.data.photo_path
  }

  // Nouvelle photo
  const photoFile = formData.get('photo') as File | null
  if (photoFile && photoFile.size > 0) {
    const result = await uploadPhoto(token, photoFile)
    if ('error' in result) return { error: result.error }
    ficheData.photo_url = result.url
    ficheData.photo_path = result.path
  }

  const { error } = await supabase
    .from('fiches')
    .update({ data: ficheData })
    .eq('token', token)

  if (error) return { error: 'Erreur lors de la sauvegarde. Réessaie.' }
  return { success: true, message: '✅ Fiche mise à jour !' }
}

/** Suppression de la fiche (session + confirmation mot de passe) */
export async function deleteFiche(
  token: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const authenticated = await getEditSession(token)
  if (!authenticated) return { error: 'Session expirée. Veuillez vous reconnecter.' }

  const password = formData.get('password') as string
  if (!password) return { error: 'Mot de passe requis pour confirmer la suppression.' }

  const supabase = createServerClient()
  const { data: fiche } = await supabase
    .from('fiches')
    .select('password_hash')
    .eq('token', token)
    .single()

  if (!fiche?.password_hash) return { error: 'Fiche introuvable.' }

  const valid = await bcrypt.compare(password, fiche.password_hash)
  if (!valid) return { error: 'Mot de passe incorrect.' }

  // Supprimer la photo si elle existe
  const { data: ficheData } = await supabase
    .from('fiches')
    .select('data')
    .eq('token', token)
    .single()
  if (ficheData?.data?.photo_path) {
    await deletePhoto(ficheData.data.photo_path)
  }

  const { error } = await supabase.from('fiches').delete().eq('token', token)
  if (error) return { error: 'Erreur lors de la suppression. Réessaie.' }

  redirect('/')
}
