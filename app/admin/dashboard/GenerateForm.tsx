'use client'

import { useActionState, useRef } from 'react'
import { generateFiches } from '../actions'
import type { GenerateResult } from '../actions'

const initial: GenerateResult = {}

export default function GenerateForm() {
  const [state, formAction, isPending] = useActionState(generateFiches, initial)
  const dialogRef = useRef<HTMLDialogElement>(null)

  return (
    <>
      <form action={formAction} className="flex items-center gap-3">
        <input
          name="count"
          type="number"
          min={1}
          max={100}
          defaultValue={1}
          className="w-20 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400 text-center font-bold"
        />
        <button
          type="submit"
          disabled={isPending}
          onClick={() => { if (state.fiches) dialogRef.current?.showModal() }}
          className="bg-lime-400 hover:bg-lime-500 disabled:opacity-60 text-gray-900 font-black px-5 py-2 rounded-xl transition-colors text-sm"
        >
          {isPending ? 'Génération…' : 'Générer des fiches'}
        </button>
        {state.error && <span className="text-red-500 text-sm">{state.error}</span>}
      </form>

      {/* Dialog résultats */}
      {state.fiches && (
        <dialog
          ref={dialogRef}
          className="rounded-2xl shadow-2xl p-0 w-full max-w-lg backdrop:bg-black/50 open:flex flex-col"
          onClick={(e) => { if (e.target === e.currentTarget) e.currentTarget.close() }}
        >
          <div className="bg-lime-300 rounded-t-2xl px-6 py-4">
            <h2 className="font-black text-gray-900">
              {state.fiches.length} fiche{state.fiches.length > 1 ? 's' : ''} générée{state.fiches.length > 1 ? 's' : ''}
            </h2>
            <p className="text-lime-800 text-sm">Copie les codes avant de fermer.</p>
          </div>

          <div className="overflow-y-auto max-h-96 px-6 py-4 space-y-2">
            {state.fiches.map((f) => (
              <div key={f.token} className="bg-gray-50 rounded-xl p-3 text-xs font-mono space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-gray-500">URL NFC</span>
                  <span className="text-gray-800 truncate">…/{f.token}/edit?claim={f.claim_code}</span>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(`https://badge.spoolio.fr/${f.token}/edit?claim=${f.claim_code}`)}
                    className="text-blue-500 hover:underline flex-shrink-0"
                  >
                    Copier
                  </button>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-gray-500">Code</span>
                  <span className="font-black tracking-widest text-gray-900">{f.claim_code}</span>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(f.claim_code)}
                    className="text-blue-500 hover:underline flex-shrink-0"
                  >
                    Copier
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center">
            <button
              type="button"
              onClick={() => {
                const text = state.fiches!
                  .map((f) => `URL NFC: https://badge.spoolio.fr/${f.token}/edit?claim=${f.claim_code}\nCode: ${f.claim_code}`)
                  .join('\n\n')
                navigator.clipboard.writeText(text)
              }}
              className="text-sm text-blue-600 font-semibold hover:underline"
            >
              Tout copier
            </button>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="bg-gray-900 text-white font-bold px-5 py-2 rounded-xl text-sm"
            >
              Fermer
            </button>
          </div>
        </dialog>
      )}
    </>
  )
}
