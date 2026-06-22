'use client'

import { useActionState, useRef, useState } from 'react'
import { claimFiche } from './actions'
import Particles from '@/app/components/Particles'
import type { ActionState, FicheData, FicheType } from '@/lib/types'

const initial: ActionState = {}
const BLOOD_GROUPS = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const SPOOLIO_BLUE = '#1B4FD8'

interface Props {
  token: string
  claimCode?: string
  type: FicheType
  existingData?: FicheData
}

export default function ClaimForm({ token, claimCode, type, existingData }: Props) {
  const action = claimFiche.bind(null, token)
  const [state, formAction, isPending] = useActionState(action, initial)
  const [photoPreview, setPhotoPreview] = useState<string | null>(existingData?.photo_url ?? null)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const d = existingData ?? {}

  const label = type === 'animal' ? 'Badge Animal' : type === 'enfant' ? 'Badge Enfant' : 'Badge Festivalier'
  const subtitle =
    type === 'animal'
      ? "Renseigne les infos de ton animal pour activer le badge."
      : type === 'enfant'
      ? "Renseigne les infos de l'enfant pour activer le badge."
      : "Entre ton code, choisis un mot de passe, remplis ta fiche."

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('La photo est trop lourde (max 5 Mo). Compresse-la ou choisis-en une autre.')
      e.target.value = ''
      return
    }
    setPhotoError(null)
    setPhotoPreview(URL.createObjectURL(file))
  }

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: SPOOLIO_BLUE }}>
      <Particles />
      <div className="max-w-md mx-auto relative z-10">

        {/* ── Header vert lime ── */}
        <div className="bg-lime-300 rounded-t-3xl px-6 pt-5 pb-8">
          <p className="text-xs font-black uppercase tracking-widest text-lime-800 mb-1">
            Spoolio Badge · Activation
          </p>
          <h1 className="text-2xl font-black text-gray-900">{label}</h1>
          <p className="text-lime-700 text-sm mt-1">{subtitle}</p>
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

            {/* Activation */}
            <section className="space-y-3">
              <h2 className="font-black text-gray-800 text-sm uppercase tracking-wider">Activation</h2>
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
                  defaultValue={claimCode ?? ''}
                  placeholder="Ex : X3MT4KLU"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-lime-400 uppercase"
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

            {/* Champs selon le type */}
            {type === 'festivalier' && (
              <FestivalierFields d={d} photoPreview={photoPreview} photoError={photoError} fileRef={fileRef} onPhotoChange={handlePhotoChange} />
            )}
            {type === 'enfant' && (
              <EnfantFields d={d} photoPreview={photoPreview} photoError={photoError} fileRef={fileRef} onPhotoChange={handlePhotoChange} />
            )}
            {type === 'animal' && (
              <AnimalFields d={d} photoPreview={photoPreview} photoError={photoError} fileRef={fileRef} onPhotoChange={handlePhotoChange} />
            )}

            {state.error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-medium">
                {state.error}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending || !!photoError}
              className="w-full bg-lime-400 hover:bg-lime-500 disabled:opacity-60 text-gray-900 font-black py-3.5 rounded-2xl transition-colors text-base"
            >
              {isPending ? 'Activation…' : 'Activer mon badge'}
            </button>

            <p className="text-center text-gray-400 text-xs pb-2">
              Tes données sont chiffrées et supprimables à tout moment.
            </p>
          </form>
        </div>

      </div>
    </div>
  )
}

// ─── Sous-formulaires par type ────────────────────────────────────────────────

interface FieldsProps {
  d: FicheData
  photoPreview: string | null
  photoError: string | null
  fileRef: React.RefObject<HTMLInputElement | null>
  onPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

function PhotoField({ photoPreview, photoError, fileRef, onPhotoChange }: Omit<FieldsProps, 'd'>) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1">Photo</label>
      <div className="flex items-center gap-4">
        {photoPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoPreview} alt="Aperçu" className="w-16 h-16 rounded-full object-cover border-2 border-lime-300 flex-shrink-0" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-2xl flex-shrink-0">📷</div>
        )}
        <div className="flex-1">
          <input ref={fileRef} name="photo" type="file" accept="image/*" className="hidden" onChange={onPhotoChange} />
          <button type="button" onClick={() => fileRef.current?.click()} className="text-sm font-semibold text-lime-600 hover:underline">
            {photoPreview ? 'Changer la photo' : 'Ajouter une photo'}
          </button>
          <p className="text-xs text-gray-400 mt-0.5">Max 5 Mo.</p>
        </div>
      </div>
      {photoError && (
        <p className="text-xs text-red-500 mt-1.5 font-medium">{photoError}</p>
      )}
    </div>
  )
}

function FestivalierFields({ d, photoPreview, photoError, fileRef, onPhotoChange }: FieldsProps) {
  return (
    <>
      <section className="space-y-3">
        <h2 className="font-black text-gray-800 text-sm uppercase tracking-wider">Identification</h2>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            Prénom ou surnom <span className="text-red-500">*</span>
          </label>
          <input name="prenom" type="text" required defaultValue={d.prenom ?? ''} placeholder="Comment t'appelle-t-on ?" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400" />
        </div>
        <PhotoField photoPreview={photoPreview} photoError={photoError} fileRef={fileRef} onPhotoChange={onPhotoChange} />
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">&ldquo;Si tu me trouves dans cet état…&rdquo;</label>
          <textarea name="intro" rows={2} defaultValue={d.intro ?? ''} placeholder="Un petit message pour celui qui scanne ton badge…" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400 resize-none" />
        </div>
      </section>

      <div className="border-t border-gray-100" />

      <section className="space-y-3">
        <h2 className="font-black text-gray-800 text-sm uppercase tracking-wider">Contacts d&apos;urgence</h2>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Contact 1 — Nom <span className="text-red-500">*</span></label>
            <input name="contact1_nom" type="text" required defaultValue={d.contact1_nom ?? ''} placeholder="Maman" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Téléphone <span className="text-red-500">*</span></label>
            <input name="contact1_tel" type="tel" required defaultValue={d.contact1_tel ?? ''} placeholder="06 12 34 56 78" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Contact 2 — Nom</label>
            <input name="contact2_nom" type="text" defaultValue={d.contact2_nom ?? ''} placeholder="Pote de tente" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Téléphone</label>
            <input name="contact2_tel" type="tel" defaultValue={d.contact2_tel ?? ''} placeholder="06 98 76 54 32" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200" />
          </div>
        </div>
      </section>

      <div className="border-t border-gray-100" />

      <section className="space-y-3">
        <h2 className="font-black text-gray-800 text-sm uppercase tracking-wider">Infos médicales</h2>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Groupe sanguin</label>
          <select name="groupe_sanguin" defaultValue={d.groupe_sanguin ?? ''} className="w-32 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white">
            {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g || '—'}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Allergies, traitements, à savoir…</label>
          <textarea name="infos_medicales" rows={3} defaultValue={d.infos_medicales ?? ''} placeholder="Allergique aux piqûres d'abeille…" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none" />
        </div>
      </section>

      <div className="border-t border-gray-100" />

      <section className="space-y-3">
        <h2 className="font-black text-gray-800 text-sm uppercase tracking-wider">Infos festivalier</h2>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Où je campe</label>
          <input name="camping" type="text" defaultValue={d.camping ?? ''} placeholder="Camping A, allée 3, tente bleue" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Langues parlées</label>
          <input name="langues" type="text" defaultValue={d.langues ?? ''} placeholder="Français, English…" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Mot libre</label>
          <textarea name="message" rows={2} defaultValue={d.message ?? ''} placeholder="Si tu me trouves K.O., appelle mes parents ☕" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none" />
        </div>
      </section>
    </>
  )
}

function EnfantFields({ d, photoPreview, photoError, fileRef, onPhotoChange }: FieldsProps) {
  return (
    <>
      <section className="space-y-3">
        <h2 className="font-black text-gray-800 text-sm uppercase tracking-wider">Identification</h2>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            Prénom de l&apos;enfant <span className="text-red-500">*</span>
          </label>
          <input name="prenom" type="text" required defaultValue={d.prenom ?? ''} placeholder="Prénom" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400" />
        </div>
        <PhotoField photoPreview={photoPreview} photoError={photoError} fileRef={fileRef} onPhotoChange={onPhotoChange} />
      </section>

      <div className="border-t border-gray-100" />

      <section className="space-y-3">
        <h2 className="font-black text-gray-800 text-sm uppercase tracking-wider">Contacts parentaux</h2>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Parent / Tuteur 1 <span className="text-red-500">*</span></label>
          <input name="tel_parent_1" type="tel" required defaultValue={d.tel_parent_1 ?? ''} placeholder="06 12 34 56 78" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Parent / Tuteur 2</label>
          <input name="tel_parent_2" type="tel" defaultValue={d.tel_parent_2 ?? ''} placeholder="06 98 76 54 32" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200" />
        </div>
      </section>

      <div className="border-t border-gray-100" />

      <section className="space-y-3">
        <h2 className="font-black text-gray-800 text-sm uppercase tracking-wider">Informations médicales</h2>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Allergies, traitements, à savoir…</label>
          <textarea name="medical" rows={3} defaultValue={d.medical ?? ''} placeholder="Allergique aux arachides, asthmatique…" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Message libre</label>
          <textarea name="message" rows={2} defaultValue={d.message ?? ''} placeholder="Infos utiles pour la personne qui scanne…" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none" />
        </div>
      </section>
    </>
  )
}

function AnimalFields({ d, photoPreview, photoError, fileRef, onPhotoChange }: FieldsProps) {
  return (
    <>
      <section className="space-y-3">
        <h2 className="font-black text-gray-800 text-sm uppercase tracking-wider">Identification</h2>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            Nom de l&apos;animal <span className="text-red-500">*</span>
          </label>
          <input name="nom" type="text" required defaultValue={d.nom ?? ''} placeholder="Rex, Minou…" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Type</label>
            <input name="type_animal" type="text" defaultValue={d.type_animal ?? ''} placeholder="Chien, Chat…" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Race</label>
            <input name="race" type="text" defaultValue={d.race ?? ''} placeholder="Labrador…" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400" />
          </div>
        </div>
        <PhotoField photoPreview={photoPreview} photoError={photoError} fileRef={fileRef} onPhotoChange={onPhotoChange} />
      </section>

      <div className="border-t border-gray-100" />

      <section className="space-y-3">
        <h2 className="font-black text-gray-800 text-sm uppercase tracking-wider">Propriétaire</h2>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Téléphone 1 <span className="text-red-500">*</span></label>
          <input name="tel_proprio_1" type="tel" required defaultValue={d.tel_proprio_1 ?? ''} placeholder="06 12 34 56 78" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Téléphone 2</label>
          <input name="tel_proprio_2" type="tel" defaultValue={d.tel_proprio_2 ?? ''} placeholder="06 98 76 54 32" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200" />
        </div>
      </section>

      <div className="border-t border-gray-100" />

      <section className="space-y-3">
        <h2 className="font-black text-gray-800 text-sm uppercase tracking-wider">Vétérinaire</h2>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Nom du vétérinaire</label>
          <input name="veto_nom" type="text" defaultValue={d.veto_nom ?? ''} placeholder="Dr. Martin" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Adresse / Téléphone</label>
          <textarea name="veto_adresse" rows={2} defaultValue={d.veto_adresse ?? ''} placeholder="12 rue des animaux, 75001 Paris — 01 23 45 67 89" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 resize-none" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Infos médicales / allergies</label>
          <textarea name="medical" rows={2} defaultValue={d.medical ?? ''} placeholder="Allergique à la pénicilline…" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Message libre</label>
          <textarea name="message" rows={2} defaultValue={d.message ?? ''} placeholder="Infos utiles pour la personne qui scanne…" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none" />
        </div>
      </section>
    </>
  )
}
