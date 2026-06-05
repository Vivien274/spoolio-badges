'use client'

import { useActionState, useRef, useState } from 'react'
import { updateFiche, deleteFiche } from './actions'
import Particles from '@/app/components/Particles'
import type { ActionState, FicheData, FicheType } from '@/lib/types'

const initial: ActionState = {}
const BLOOD_GROUPS = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const SPOOLIO_BLUE = '#1B4FD8'

interface Props {
  token: string
  data: FicheData
  type: FicheType
}

export default function EditForm({ token, data, type }: Props) {
  const updateAction = updateFiche.bind(null, token)
  const deleteAction = deleteFiche.bind(null, token)

  const [updateState, formUpdateAction, isUpdating] = useActionState(updateAction, initial)
  const [deleteState, formDeleteAction, isDeleting] = useActionState(deleteAction, initial)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(data.photo_url ?? null)
  const fileRef = useRef<HTMLInputElement>(null)

  const heading = type === 'animal' ? (data.nom || 'Mon animal') : (data.prenom || 'Ma fiche')
  const subtext =
    type === 'animal' ? 'Modifie les infos ci-dessous.' :
    type === 'enfant' ? 'Modifie les infos ci-dessous.' :
    'Modifie tes infos ci-dessous.'

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setPhotoPreview(URL.createObjectURL(file))
  }

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: SPOOLIO_BLUE }}>
      <Particles />
      <div className="max-w-md mx-auto relative z-10">

        {/* ── Header vert lime ── */}
        <div className="bg-lime-300 rounded-t-3xl px-6 pt-5 pb-8">
          <p className="text-xs font-black uppercase tracking-widest text-lime-800 mb-2">
            Spoolio Badge · Édition
          </p>
          <div className="flex items-center gap-4">
            {photoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoPreview} alt="Photo" className="w-14 h-14 rounded-full object-cover border-4 border-white/60 flex-shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-lime-200 border-4 border-white/60 flex items-center justify-center text-xl flex-shrink-0">📷</div>
            )}
            <div>
              <h1 className="text-2xl font-black text-gray-900">{heading}</h1>
              <p className="text-lime-800 text-sm">{subtext}</p>
            </div>
          </div>
        </div>

        {/* ── Séparateur ── */}
        <div className="relative h-0 z-10">
          <div className="absolute -left-3 -top-3.5 w-7 h-7 rounded-full" style={{ background: SPOOLIO_BLUE }} />
          <div className="absolute -right-3 -top-3.5 w-7 h-7 rounded-full" style={{ background: SPOOLIO_BLUE }} />
        </div>

        {/* ── Formulaire blanc ── */}
        <div className="bg-white rounded-b-3xl px-6 pb-8 pt-0">
          <div className="border-t-2 border-dashed border-gray-200 mx-2 mb-6 pt-5" />

          <form action={formUpdateAction} className="space-y-5">

            {type === 'festivalier' && (
              <FestivalierFields data={data} photoPreview={photoPreview} fileRef={fileRef} onPhotoChange={handlePhotoChange} />
            )}
            {type === 'enfant' && (
              <EnfantFields data={data} photoPreview={photoPreview} fileRef={fileRef} onPhotoChange={handlePhotoChange} />
            )}
            {type === 'animal' && (
              <AnimalFields data={data} photoPreview={photoPreview} fileRef={fileRef} onPhotoChange={handlePhotoChange} />
            )}

            {updateState.error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-medium">
                {updateState.error}
              </div>
            )}
            {updateState.success && (
              <div className="bg-lime-50 border border-lime-200 text-lime-800 rounded-xl px-4 py-3 text-sm font-medium">
                {updateState.message}
              </div>
            )}

            <button
              type="submit"
              disabled={isUpdating}
              className="w-full bg-lime-400 hover:bg-lime-500 disabled:opacity-60 text-gray-900 font-black py-3.5 rounded-2xl transition-colors text-base"
            >
              {isUpdating ? 'Sauvegarde…' : 'Enregistrer les modifications'}
            </button>

            <p className="text-center text-gray-400 text-xs">
              Tes données sont stockées de façon sécurisée et supprimables à tout moment.
            </p>
          </form>

          {/* Zone de suppression */}
          <div className="mt-8 border-t border-gray-100 pt-6">
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full border border-red-200 text-red-400 hover:bg-red-50 font-semibold py-2.5 rounded-2xl transition-colors text-sm"
              >
                Supprimer ma fiche (RGPD)
              </button>
            ) : (
              <form action={formDeleteAction} className="space-y-3">
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-3">
                  <p className="text-red-700 font-bold text-sm">Suppression définitive — irréversible.</p>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Confirme avec ton mot de passe</label>
                    <input
                      name="password"
                      type="password"
                      required
                      autoFocus
                      placeholder="••••••••"
                      className="w-full border border-red-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                    />
                  </div>
                  {deleteState.error && <p className="text-red-700 text-sm font-medium">{deleteState.error}</p>}
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowDeleteConfirm(false)} className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold py-2 rounded-xl transition-colors text-sm">
                      Annuler
                    </button>
                    <button type="submit" disabled={isDeleting} className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white font-black py-2 rounded-xl transition-colors text-sm">
                      {isDeleting ? 'Suppression…' : 'Supprimer'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

// ─── Sous-formulaires par type ────────────────────────────────────────────────

interface FieldsProps {
  data: FicheData
  photoPreview: string | null
  fileRef: React.RefObject<HTMLInputElement | null>
  onPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

function PhotoField({ photoPreview, fileRef, onPhotoChange }: Omit<FieldsProps, 'data'>) {
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
    </div>
  )
}

function FestivalierFields({ data: d, photoPreview, fileRef, onPhotoChange }: FieldsProps) {
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
        <PhotoField photoPreview={photoPreview} fileRef={fileRef} onPhotoChange={onPhotoChange} />
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

function EnfantFields({ data: d, photoPreview, fileRef, onPhotoChange }: FieldsProps) {
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
        <PhotoField photoPreview={photoPreview} fileRef={fileRef} onPhotoChange={onPhotoChange} />
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

function AnimalFields({ data: d, photoPreview, fileRef, onPhotoChange }: FieldsProps) {
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
        <PhotoField photoPreview={photoPreview} fileRef={fileRef} onPhotoChange={onPhotoChange} />
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
