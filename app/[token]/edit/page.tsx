import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import { getEditSession } from '@/lib/session'
import ClaimForm from './ClaimForm'
import PasswordForm from './PasswordForm'
import EditForm from './EditForm'
import type { Fiche } from '@/lib/types'

type Props = {
  params: Promise<{ token: string }>
}

async function getFiche(token: string): Promise<Fiche | null> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('fiches')
    .select('id, token, password_hash, type, is_claimed, data, failed_attempts, locked_until, created_at, updated_at')
    .eq('token', token)
    .single()
  if (error || !data) return null
  return data as Fiche
}

export default async function EditPage({ params }: Props) {
  const { token } = await params
  const fiche = await getFiche(token)

  if (!fiche) notFound()

  const type = fiche.type ?? 'festivalier'

  // Fiche sans mot de passe (nouvelle ou migrée) → flux activation
  // Pour les fiches migrées (is_claimed=true, password_hash=null), on pré-remplit les données
  if (!fiche.password_hash) {
    return (
      <ClaimForm
        token={token}
        type={type}
        existingData={fiche.is_claimed ? fiche.data : undefined}
      />
    )
  }

  // Mot de passe défini → vérifier la session
  const hasSession = await getEditSession(token)

  if (!hasSession) {
    return <PasswordForm token={token} />
  }

  return <EditForm token={token} data={fiche.data} type={type} />
}
