'use server'

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import { setEditSession, getEditSession } from '@/lib/session'
import bcrypt from 'bcryptjs'
import type { ActionState, FicheData, FicheType } from '@/lib/types'

const SALT_ROUNDS = 12
const MAX_ATTEMPTS = 5
const LOCKOUT_MINUTES = 15
const PHOTO_BUCKET = 'badge-photos'
const PHOTO_MAX_BYTES = 5 * 1024 * 1024

// ─── Rate limiting ────────────────────────────────────────────────────────────

async function checkLock(token: string): Promise<{ locked: boolean; minutesLeft?: number }> {
  const supabase = createServerClient()
  const { data } = await supabase.from('fiches').select('locked_until').eq('token', token).single()
  if (data?.locked_until && new Date(data.locked_until) > new Date()) {
    const minutesLeft = Math.ceil((new Date(data.locked_until).getTime() - Date.now()) / 60_000)
    return { locked: true, minutesLeft }
  }
  return { locked: false }
}

async function recordFailure(token: string): Promise<void> {
  const supabase = createServerClient()
  const { data } = await supabase.from('fiches').select('failed_attempts').eq('token', token).single()
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

async function uploadPhoto(token: string, file: File): Promise<{ url: string; path: string } | { error: string }> {
  if (!file.type.startsWith('image/')) return { error: 'Le fichier doit être une image.' }
  if (file.size > PHOTO_MAX_BYTES) return { error: 'La photo ne doit pas dépasser 5 Mo.' }
  const buffer = Buffer.from(await file.arrayBuffer())
  const supabase = createServerClient()
  const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(token, buffer, { contentType: file.type, upsert: true })
  if (error) return { error: "Erreur lors de l'upload de la photo." }
  const { data } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(token)
  return { url: data.publicUrl, path: token }
}

async function deletePhoto(path: string): Promise<void> {
  const supabase = createServerClient()
  await supabase.storage.from(PHOTO_BUCKET).remove([path])
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function t(val: FormDataEntryValue | null): string | undefined {
  return (val as string)?.trim() || undefined
}

function extractFicheData(formData: FormData): FicheData {
  return {
    // Commun
    ref: t(formData.get('ref')),
    email: t(formData.get('email')),
    message: t(formData.get('message')),
    medical: t(formData.get('medical')),
    // Festivalier
    prenom: t(formData.get('prenom')),
    intro: t(formData.get('intro')),
    contact1_nom: t(formData.get('contact1_nom')),
    contact1_tel: t(formData.get('contact1_tel')),
    contact2_nom: t(formData.get('contact2_nom')),
    contact2_tel: t(formData.get('contact2_tel')),
    infos_medicales: t(formData.get('infos_medicales')),
    groupe_sanguin: t(formData.get('groupe_sanguin')),
    camping: t(formData.get('camping')),
    langues: t(formData.get('langues')),
    // Enfant
    tel_parent_1: t(formData.get('tel_parent_1')),
    tel_parent_2: t(formData.get('tel_parent_2')),
    // Animal
    nom: t(formData.get('nom')),
    type_animal: t(formData.get('type_animal')),
    race: t(formData.get('race')),
    tel_proprio_1: t(formData.get('tel_proprio_1')),
    tel_proprio_2: t(formData.get('tel_proprio_2')),
    veto_nom: t(formData.get('veto_nom')),
    veto_adresse: t(formData.get('veto_adresse')),
  }
}

function validateRequired(ficheData: FicheData, type: FicheType): string | null {
  if (type === 'festivalier') {
    if (!ficheData.prenom) return 'Le prénom est requis.'
    if (!ficheData.contact1_nom) return 'Le nom du contact 1 est requis.'
    if (!ficheData.contact1_tel) return 'Le téléphone du contact 1 est requis.'
  } else if (type === 'enfant') {
    if (!ficheData.prenom) return 'Le prénom de l\'enfant est requis.'
    if (!ficheData.tel_parent_1) return 'Le téléphone du parent 1 est requis.'
  } else if (type === 'animal') {
    if (!ficheData.nom) return 'Le nom de l\'animal est requis.'
    if (!ficheData.tel_proprio_1) return 'Le téléphone du propriétaire est requis.'
  }
  return null
}

// ─── Actions ─────────────────────────────────────────────────────────────────

export async function claimFiche(token: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirm_password') as string

  if (!password || password.length < 8) return { error: 'Le mot de passe doit faire au moins 8 caractères.' }
  if (password !== confirmPassword) return { error: 'Les mots de passe ne correspondent pas.' }

  const ficheData = extractFicheData(formData)

  const { locked, minutesLeft } = await checkLock(token)
  if (locked) return { error: `Trop de tentatives. Réessaie dans ${minutesLeft} min.` }

  const supabase = createServerClient()
  const { data: fiche, error } = await supabase
    .from('fiches')
    .select('is_claimed, password_hash, type, data')
    .eq('token', token)
    .single()

  if (error || !fiche) return { error: 'Fiche introuvable.' }
  if (fiche.password_hash) return { error: 'Cette fiche est déjà activée.' }

  const ficheType = (fiche.type ?? 'festivalier') as FicheType
  const validationError = validateRequired(ficheData, ficheType)
  if (validationError) return { error: validationError }

  // Photo optionnelle
  const photoFile = formData.get('photo') as File | null
  if (photoFile && photoFile.size > 0) {
    const result = await uploadPhoto(token, photoFile)
    if ('error' in result) return { error: result.error }
    ficheData.photo_url = result.url
    ficheData.photo_path = result.path
  } else {
    // Conserver la photo existante (fiches migrées)
    const existing = fiche.data as FicheData | null
    if (existing?.photo_url) {
      ficheData.photo_url = existing.photo_url
      ficheData.photo_path = existing.photo_path
    }
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

  const { error: updateError } = await supabase
    .from('fiches')
    .update({
      is_claimed: true,
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

export async function verifyPassword(token: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const password = formData.get('password') as string
  if (!password) return { error: 'Mot de passe requis.' }

  const { locked, minutesLeft } = await checkLock(token)
  if (locked) return { error: `Trop de tentatives. Réessaie dans ${minutesLeft} min.` }

  const supabase = createServerClient()
  const { data: fiche } = await supabase.from('fiches').select('password_hash').eq('token', token).single()

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

export async function updateFiche(token: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const authenticated = await getEditSession(token)
  if (!authenticated) return { error: 'Session expirée. Veuillez vous reconnecter.' }

  const ficheData = extractFicheData(formData)

  const supabase = createServerClient()
  const { data: existing } = await supabase.from('fiches').select('type, data').eq('token', token).single()

  const ficheType = ((existing?.type as FicheType) ?? 'festivalier')
  const validationError = validateRequired(ficheData, ficheType)
  if (validationError) return { error: validationError }

  // Conserver photo existante si pas de nouvelle
  const existingData = existing?.data as FicheData | null
  if (existingData?.photo_url) {
    ficheData.photo_url = existingData.photo_url
    ficheData.photo_path = existingData.photo_path
  }

  const photoFile = formData.get('photo') as File | null
  if (photoFile && photoFile.size > 0) {
    const result = await uploadPhoto(token, photoFile)
    if ('error' in result) return { error: result.error }
    ficheData.photo_url = result.url
    ficheData.photo_path = result.path
  }

  const { error } = await supabase.from('fiches').update({ data: ficheData }).eq('token', token)
  if (error) return { error: 'Erreur lors de la sauvegarde. Réessaie.' }
  return { success: true, message: '✅ Fiche mise à jour !' }
}

export async function deleteFiche(token: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const authenticated = await getEditSession(token)
  if (!authenticated) return { error: 'Session expirée. Veuillez vous reconnecter.' }

  const password = formData.get('password') as string
  if (!password) return { error: 'Mot de passe requis pour confirmer la suppression.' }

  const supabase = createServerClient()
  const { data: fiche } = await supabase.from('fiches').select('password_hash, data').eq('token', token).single()

  if (!fiche?.password_hash) return { error: 'Fiche introuvable.' }

  const valid = await bcrypt.compare(password, fiche.password_hash)
  if (!valid) return { error: 'Mot de passe incorrect.' }

  const photoPath = (fiche.data as FicheData | null)?.photo_path
  if (photoPath) await deletePhoto(photoPath)

  const { error } = await supabase.from('fiches').delete().eq('token', token)
  if (error) return { error: 'Erreur lors de la suppression. Réessaie.' }

  redirect('/')
}
