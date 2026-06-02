import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import { getEditSession } from '@/lib/session'
import ClaimForm from './ClaimForm'
import PasswordForm from './PasswordForm'
import EditForm from './EditForm'
import type { Fiche } from '@/lib/types'

type Props = {
  params: Promise<{ token: string }>
  searchParams: Promise<{ claim?: string }>
}

async function getFiche(token: string): Promise<Fiche | null> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('fiches')
    .select('id, token, is_claimed, data, failed_attempts, locked_until, created_at, updated_at')
    .eq('token', token)
    .single()
  if (error || !data) return null
  return data as Fiche
}

export default async function EditPage({ params, searchParams }: Props) {
  const { token } = await params
  const { claim } = await searchParams
  const fiche = await getFiche(token)

  if (!fiche) notFound()

  // Fiche pas encore revendiquée → formulaire d'activation
  if (!fiche.is_claimed) {
    return <ClaimForm token={token} claimCode={claim} />
  }

  // Fiche revendiquée → vérifier la session
  const hasSession = await getEditSession(token)

  if (!hasSession) {
    return <PasswordForm token={token} />
  }

  // Session valide → formulaire d'édition
  return <EditForm token={token} data={fiche.data} />
}
