'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
import { adminDeleteFiche } from '../actions'
import type { ActionState } from '@/lib/types'

const initial: ActionState = {}

export default function DeleteButton({ token }: { token: string }) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(adminDeleteFiche, initial)

  useEffect(() => {
    if (state.success) router.refresh()
  }, [state.success, router])

  return (
    <form action={formAction} className="inline-flex flex-shrink-0">
      <input type="hidden" name="token" value={token} />
      <button
        type="submit"
        disabled={isPending}
        onClick={(e) => { if (!confirm('Supprimer cette fiche ?')) e.preventDefault() }}
        className="text-red-400 hover:text-red-600 disabled:opacity-40 transition-colors"
        title={state.error ?? 'Supprimer'}
      >
        {isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
      </button>
    </form>
  )
}
