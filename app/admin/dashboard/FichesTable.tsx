'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import CopyButton from './CopyButton'
import CopyEmailButton from './CopyEmailButton'
import EncodeNfcButton from './EncodeNfcButton'
import DeleteButton from './DeleteButton'
import type { Fiche, FicheType } from '@/lib/types'

type StatutFilter = 'all' | 'active' | 'migrated' | 'pending'
type TypeFilter = 'all' | FicheType

const TYPE_LABELS: Record<FicheType, string> = {
  festivalier: 'Festivalier',
  enfant: 'Enfant',
  animal: 'Animal',
}

const TYPE_COLORS: Record<FicheType, string> = {
  festivalier: 'bg-purple-100 text-purple-700',
  enfant: 'bg-sky-100 text-sky-700',
  animal: 'bg-orange-100 text-orange-700',
}

function statutInfo(fiche: Fiche): { label: string; color: string; key: StatutFilter } {
  if (!fiche.is_claimed) return { label: 'En attente', color: 'bg-amber-100 text-amber-700', key: 'pending' }
  if (fiche.claim_code) return { label: 'Migrée', color: 'bg-blue-100 text-blue-700', key: 'migrated' }
  return { label: 'Activée', color: 'bg-lime-100 text-lime-700', key: 'active' }
}

interface Props {
  fiches: Fiche[]
}

export default function FichesTable({ fiches }: Props) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [statutFilter, setStatutFilter] = useState<StatutFilter>('all')

  const filtered = useMemo(() => {
    return fiches.filter((f) => {
      if (search) {
        const q = search.toLowerCase()
        const name = (f.data?.nom ?? f.data?.prenom ?? '').toLowerCase()
        const ref = (f.data?.ref ?? '').toLowerCase()
        const email = (f.data?.email ?? '').toLowerCase()
        const token = f.token.toLowerCase()
        if (!name.includes(q) && !ref.includes(q) && !email.includes(q) && !token.includes(q)) return false
      }
      if (typeFilter !== 'all' && (f.type ?? 'festivalier') !== typeFilter) return false
      if (statutFilter !== 'all' && statutInfo(f).key !== statutFilter) return false
      return true
    })
  }, [fiches, search, typeFilter, statutFilter])

  function FilterPill<T extends string>({
    value, current, label, onClick,
  }: { value: T; current: T; label: string; onClick: (v: T) => void }) {
    const active = value === current
    return (
      <button
        type="button"
        onClick={() => onClick(value)}
        className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
          active ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        }`}
      >
        {label}
      </button>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

      {/* ── Filtres ── */}
      <div className="px-6 py-4 border-b border-gray-100 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher nom, ref, email, token…"
            className="flex-1 min-w-48 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400"
          />
          <span className="text-xs text-gray-400 whitespace-nowrap">
            {filtered.length} / {fiches.length} fiche{fiches.length > 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</span>
            <div className="flex gap-1">
              <FilterPill value="all" current={typeFilter} label="Tous" onClick={setTypeFilter} />
              <FilterPill value="festivalier" current={typeFilter} label="Festivalier" onClick={setTypeFilter} />
              <FilterPill value="enfant" current={typeFilter} label="Enfant" onClick={setTypeFilter} />
              <FilterPill value="animal" current={typeFilter} label="Animal" onClick={setTypeFilter} />
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Statut</span>
            <div className="flex gap-1">
              <FilterPill value="all" current={statutFilter} label="Tous" onClick={setStatutFilter} />
              <FilterPill value="active" current={statutFilter} label="Activée" onClick={setStatutFilter} />
              <FilterPill value="migrated" current={statutFilter} label="Migrée" onClick={setStatutFilter} />
              <FilterPill value="pending" current={statutFilter} label="En attente" onClick={setStatutFilter} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Tableau ── */}
      {filtered.length === 0 ? (
        <div className="px-6 py-12 text-center text-gray-400 text-sm">
          Aucune fiche ne correspond aux filtres.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-2 text-left">Ref / Token</th>
                <th className="px-6 py-2 text-left">Claim code</th>
                <th className="px-6 py-2 text-left">Type</th>
                <th className="px-6 py-2 text-left">Nom</th>
                <th className="px-6 py-2 text-left">Statut</th>
                <th className="px-6 py-2 text-left">Créée le</th>
                <th className="px-6 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((fiche) => {
                const st = statutInfo(fiche)
                const type = (fiche.type ?? 'festivalier') as FicheType
                return (
                  <tr key={fiche.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="space-y-0.5">
                        {fiche.data?.ref && (
                          <p className="text-xs font-bold text-gray-500">{fiche.data.ref}</p>
                        )}
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/${fiche.token}`}
                            target="_blank"
                            className="font-mono text-xs text-blue-600 hover:underline"
                          >
                            {fiche.token.slice(0, 12)}…
                          </Link>
                          <CopyButton text={`https://badge.spoolio.fr/${fiche.token}/edit?claim=${fiche.claim_code ?? ''}`} />
                          <EncodeNfcButton url={`https://badge.spoolio.fr/${fiche.token}`} />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      {fiche.claim_code ? (
                        <div className="flex items-center">
                          <span className="font-mono text-xs font-bold tracking-widest text-gray-800">
                            {fiche.claim_code}
                          </span>
                          <CopyButton text={fiche.claim_code} />
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300">utilisé</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${TYPE_COLORS[type]}`}>
                        {TYPE_LABELS[type]}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-700 font-medium">
                      <div>
                        <span>{fiche.data?.nom ?? fiche.data?.prenom ?? '—'}</span>
                        {fiche.data?.email && (
                          <p className="text-xs text-gray-400">{fiche.data.email}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${st.color}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(fiche.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        {fiche.claim_code && <CopyEmailButton fiche={fiche} />}
                        <DeleteButton token={fiche.token} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
