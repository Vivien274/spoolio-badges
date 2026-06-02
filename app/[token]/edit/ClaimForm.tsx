'use client'

import { useActionState, useRef, useState } from 'react'
import { claimFiche } from './actions'
import Particles from '@/app/components/Particles'
import type { ActionState } from '@/lib/types'

const initial: ActionState = {}
const BLOOD_GROUPS = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const SPOOLIO_BLUE = '#1B4FD8'

export default function ClaimForm({ token }: { token: string }) {
  const action = claimFiche.bind(null, token)
  const [state, formAction, isPending] = useActionState(action, initial)
  const [preview, setPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setPreview(URL.createObjectURL(file))
  }

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: SPOOLIO_BLUE }}>
      <Particles />
      <div className="max-w-md mx-auto relative z-10">

        {/* ── Header vert lime ── */}
        <div className="bg-lime-300 rounded-t-3xl px-6 pt-5 pb-8">
          <p className="text-xs font-black uppercase tracking-widest text-lime-800 mb-2">
            Spoolio Badge · Activation
          </p>
          <h1 className="text-2xl font-black text-gray-900">Configure ton badge SOS</h1>
          <p className="text-lime-800 text-sm mt-1">
            Entre ton code, choisis un mot de passe, remplis ta fiche.
          </p>
        </div>

        {/* ── Séparateur ── */}
        <div className="relative h-0 z-10">
          <div className="absolute -left-3 -top-3.5 w-7 h-7 rounded-full" style={{ background: SPOOLIO_BLUE }} />
          <div className="absolute -right-3 -top-3.5 w-7 h-7 rounded-full" style={{ background: SPOOLIO_BLUE }} />
        </div>

        {/* ── Formulaire blanc ── */}
        <div className="bg-white rounded-b-3xl px-6 pb-8 pt-0">
          <div className="border-t-2 border-dashed border-gray-200 mx-2 mb-6 pt-5" />

          <form action={formAction} className="space-y-5">

            {/* Sécurité */}
            <section className="space-y-3">
              <h2 className="font-black text-gray-800 text-sm uppercase tracking-wider">Sécurité</h2>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Code de revendication <span className="text-red-500">*</span>
                </label>
                <input
                  name="claim_code"
                  type="text"
                  required
                  autoComplete="off"
                  autoFocus
                  placeholder="Code fourni avec ton badge"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-lime-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Mot de passe <span className="text-red-500">*</span>
                </label>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  placeholder="8 caractères minimum"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Confirme le mot de passe <span className="text-red-500">*</span>
                </label>
                <input
                  name="confirm_password"
                  type="password"
                  required
                  minLength={8}
                  placeholder="Répète ton mot de passe"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400"
                />
              </div>
            </section>

            <div className="border-t border-gray-100" />

            {/* Identité */}
            <section className="space-y-3">
              <h2 className="font-black text-gray-800 text-sm uppercase tracking-wider">Identification</h2>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Prénom ou surnom <span className="text-red-500">*</span>
                </label>
                <input
                  name="prenom"
                  type="text"
                  required
                  placeholder="Comment t'appelle-t-on ?"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Ta photo</label>
                <div className="flex items-center gap-4">
                  {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview} alt="Aperçu" className="w-16 h-16 rounded-full object-cover border-2 border-lime-300 flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center flex-shrink-0 text-2xl">
                      📷
                    </div>
                  )}
                  <div className="flex-1">
                    <input ref={fileRef} name="photo" type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                    <button type="button" onClick={() => fileRef.current?.click()} className="text-sm font-semibold text-lime-600 hover:underline">
                      {preview ? 'Changer la photo' : 'Ajouter une photo'}
                    </button>
                    <p className="text-xs text-gray-400 mt-0.5">Aide les secours à t&apos;identifier. Max 5 Mo.</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  &ldquo;Si tu me trouves dans cet état…&rdquo;
                </label>
                <textarea
                  name="intro"
                  rows={2}
                  placeholder="Un petit message pour celui qui scanne ton badge…"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400 resize-none"
                />
              </div>
            </section>

            <div className="border-t border-gray-100" />

            {/* Contacts */}
            <section className="space-y-3">
              <h2 className="font-black text-gray-800 text-sm uppercase tracking-wider">Contacts d&apos;urgence</h2>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Contact 1 — Nom</label>
                  <input name="contact1_nom" type="text" placeholder="Maman" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Téléphone</label>
                  <input name="contact1_tel" type="tel" placeholder="06 12 34 56 78" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Contact 2 — Nom</label>
                  <input name="contact2_nom" type="text" placeholder="Pote de tente" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Téléphone</label>
                  <input name="contact2_tel" type="tel" placeholder="06 98 76 54 32" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200" />
                </div>
              </div>
            </section>

            <div className="border-t border-gray-100" />

            {/* Médical */}
            <section className="space-y-3">
              <h2 className="font-black text-gray-800 text-sm uppercase tracking-wider">Infos médicales</h2>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Groupe sanguin</label>
                <select name="groupe_sanguin" className="w-32 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white">
                  {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g || '—'}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Allergies, traitements, à savoir…</label>
                <textarea name="infos_medicales" rows={3} placeholder="Allergique aux piqûres d'abeille, prends du Ventoline…" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none" />
              </div>
            </section>

            <div className="border-t border-gray-100" />

            {/* Festivalier */}
            <section className="space-y-3">
              <h2 className="font-black text-gray-800 text-sm uppercase tracking-wider">Infos festivalier</h2>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Où je campe</label>
                <input name="camping" type="text" placeholder="Camping A, allée 3, tente bleue avec une flamme" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Langues parlées</label>
                <input name="langues" type="text" placeholder="Français, English, Español…" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Mot libre / message rigolo</label>
                <textarea name="message" rows={2} placeholder="Si tu me trouves K.O., appelle mes parents et offre-moi un café ☕" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none" />
              </div>
            </section>

            {state.error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-medium">
                {state.error}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-lime-400 hover:bg-lime-500 disabled:opacity-60 text-gray-900 font-black py-3.5 rounded-2xl transition-colors text-base"
            >
              {isPending ? 'Activation…' : 'Activer mon badge 🚀'}
            </button>

            <p className="text-center text-gray-400 text-xs pb-2">
              Tes données sont stockées de façon sécurisée et supprimables à tout moment depuis cette page.
            </p>
          </form>
        </div>

      </div>
    </div>
  )
}
