'use client'

import { useActionState } from 'react'
import { verifyPassword } from './actions'
import Particles from '@/app/components/Particles'
import type { ActionState } from '@/lib/types'

const initial: ActionState = {}
const SPOOLIO_BLUE = '#1B4FD8'

export default function PasswordForm({ token }: { token: string }) {
  const action = verifyPassword.bind(null, token)
  const [state, formAction, isPending] = useActionState(action, initial)

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: SPOOLIO_BLUE }}>
      <Particles />
      <div className="w-full max-w-sm relative z-10">

        {/* ── Header vert lime ── */}
        <div className="bg-lime-300 rounded-t-3xl px-6 pt-5 pb-8">
          <p className="text-xs font-black uppercase tracking-widest text-lime-800 mb-2">
            Spoolio Badge · Édition
          </p>
          <h1 className="text-2xl font-black text-gray-900">Modifier ma fiche</h1>
          <p className="text-lime-800 text-sm mt-1">Entre ton mot de passe pour accéder à l&apos;édition.</p>
        </div>

        {/* ── Séparateur ── */}
        <div className="relative h-0 z-10">
          <div className="absolute -left-3 -top-3.5 w-7 h-7 rounded-full" style={{ background: SPOOLIO_BLUE }} />
          <div className="absolute -right-3 -top-3.5 w-7 h-7 rounded-full" style={{ background: SPOOLIO_BLUE }} />
        </div>

        {/* ── Form blanc ── */}
        <div className="bg-white rounded-b-3xl px-6 pb-8 pt-0">
          <div className="border-t-2 border-dashed border-gray-200 mx-2 mb-6 pt-5" />

          <form action={formAction} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Mot de passe</label>
              <input
                name="password"
                type="password"
                required
                autoFocus
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400"
              />
            </div>

            {state.error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-medium">
                {state.error}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-lime-400 hover:bg-lime-500 disabled:opacity-60 text-gray-900 font-black py-3.5 rounded-2xl transition-colors"
            >
              {isPending ? 'Vérification…' : 'Accéder à ma fiche'}
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}
