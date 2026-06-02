'use client'

import { useActionState } from 'react'
import { adminDeleteFiche } from '../actions'
import type { ActionState } from '@/lib/types'

const initial: ActionState = {}

export default function DeleteButton({ token }: { token: string }) {
  const [state, formAction, isPending] = useActionState(adminDeleteFiche, initial)

  return (
    <form action={formAction}>
      <input type="hidden" name="token" value={token} />
      <button
        type="submit"
        disabled={isPending}
        onClick={(e) => { if (!confirm('Supprimer cette fiche ?')) e.preventDefault() }}
        className="text-red-400 hover:text-red-600 disabled:opacity-40 text-xs font-semibold transition-colors"
      >
        {isPending ? '…' : state.error ? '⚠' : 'Supprimer'}
      </button>
    </form>
  )
}
