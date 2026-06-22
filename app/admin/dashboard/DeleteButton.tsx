'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
    <form action={formAction} className="inline-flex items-center gap-1.5">
      <input type="hidden" name="token" value={token} />
      <button
        type="submit"
        disabled={isPending}
        onClick={(e) => { if (!confirm('Supprimer cette fiche ?')) e.preventDefault() }}
        className="text-red-400 hover:text-red-600 disabled:opacity-40 text-xs font-semibold transition-colors"
      >
        {isPending ? '…' : 'Supprimer'}
      </button>
      {state.error && (
        <span className="text-red-500 text-xs" title={state.error}>⚠ {state.error}</span>
      )}
    </form>
  )
}
