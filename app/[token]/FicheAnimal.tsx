import Link from 'next/link'
import { Phone, AlertTriangle, MapPin, MessageCircle } from 'lucide-react'
import Particles from '@/app/components/Particles'
import type { Fiche } from '@/lib/types'

const BG = '#064E3B'

export default function FicheAnimal({ fiche }: { fiche: Fiche }) {
  const { token, data: d } = fiche

  const subtitle = [d.type_animal, d.race].filter(Boolean).join(' · ')

  return (
    <main
      className="min-h-screen px-4 py-8 flex flex-col items-center justify-start"
      style={{ background: BG }}
    >
      <Particles variant="animal" />
      <div className="w-full max-w-sm relative z-10">

        {/* ═══ CARTE ═══ */}
        <div className="rounded-3xl overflow-hidden shadow-2xl">

          {/* ── Bandeau urgent ── */}
          <div className="bg-amber-400 px-5 py-2.5 flex items-center gap-2">
            <span className="text-xl">🐾</span>
            <p className="text-xs font-black uppercase tracking-widest text-amber-900">
              Animal trouvé — contacter le propriétaire
            </p>
          </div>

          {/* ── Header sable ── */}
          <div className="px-5 pt-4 pb-5" style={{ background: '#FEF3C7' }}>
            <div className="flex items-center gap-4">
              {/* Photo carrée */}
              {d.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={d.photo_url}
                  alt={d.nom ?? 'Photo'}
                  className="w-24 h-24 rounded-2xl object-cover shadow-lg flex-shrink-0"
                  style={{ border: '3px solid #FDE68A' }}
                />
              ) : (
                <div
                  className="w-24 h-24 rounded-2xl bg-amber-100 flex items-center justify-center text-4xl flex-shrink-0 shadow-lg"
                  style={{ border: '3px solid #FDE68A' }}
                >
                  🐕
                </div>
              )}

              {/* Identité */}
              <div className="min-w-0">
                <h1 className="text-3xl font-black text-amber-900 leading-tight">
                  {d.nom || 'Animal'}
                </h1>
                {subtitle && (
                  <p className="text-amber-700 font-semibold text-sm mt-0.5">{subtitle}</p>
                )}
              </div>
            </div>
          </div>

          {/* ── Corps blanc ── */}
          <div className="bg-white px-5 pb-6 pt-5 space-y-4">

            {/* Téléphones propriétaire — gros boutons */}
            {(d.tel_proprio_1 || d.tel_proprio_2) && (
              <section>
                <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-700 mb-3">
                  <Phone size={12} /> Appeler le propriétaire
                </p>
                <div className="space-y-2">
                  {d.tel_proprio_1 && (
                    <a
                      href={`tel:${d.tel_proprio_1}`}
                      className="flex items-center justify-between w-full rounded-2xl px-4 py-3.5 font-black text-white text-lg transition-opacity hover:opacity-90 active:opacity-75"
                      style={{ background: '#D97706' }}
                    >
                      <span className="text-sm font-bold opacity-80">Téléphone 1</span>
                      <span>{d.tel_proprio_1}</span>
                    </a>
                  )}
                  {d.tel_proprio_2 && (
                    <a
                      href={`tel:${d.tel_proprio_2}`}
                      className="flex items-center justify-between w-full rounded-2xl px-4 py-3.5 font-black text-amber-900 text-lg transition-opacity hover:opacity-90 active:opacity-75 bg-amber-100"
                    >
                      <span className="text-sm font-bold opacity-70">Téléphone 2</span>
                      <span>{d.tel_proprio_2}</span>
                    </a>
                  )}
                </div>
              </section>
            )}

            {/* Vétérinaire */}
            {(d.veto_nom || d.veto_adresse) && (
              <section className="border-t border-gray-100 pt-4">
                <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-700 mb-2">
                  <MapPin size={12} /> Vétérinaire
                </p>
                <div className="rounded-xl overflow-hidden border border-emerald-100">
                  {d.veto_nom && (
                    <div className="bg-emerald-50 px-3 py-2 font-semibold text-gray-800 text-sm border-b border-emerald-100">
                      {d.veto_nom}
                    </div>
                  )}
                  {d.veto_adresse && (
                    <div className="px-3 py-2 text-gray-600 text-sm whitespace-pre-wrap">
                      {d.veto_adresse}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Infos médicales */}
            {d.medical && (
              <section className="border-t border-gray-100 pt-4">
                <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-red-600 mb-2">
                  <AlertTriangle size={12} /> Infos médicales
                </p>
                <div className="bg-red-50 border-l-4 border-red-400 rounded-r-xl px-3 py-2.5">
                  <p className="text-gray-800 text-sm whitespace-pre-wrap">{d.medical}</p>
                </div>
              </section>
            )}

            {/* Message */}
            {d.message && (
              <section className="border-t border-gray-100 pt-4">
                <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-gray-400 mb-1">
                  <MessageCircle size={12} /> Message du propriétaire
                </p>
                <p className="text-gray-700 text-sm italic">{d.message}</p>
              </section>
            )}

          </div>
        </div>

        {/* ── Bouton modifier ── */}
        <div className="mt-4">
          <Link
            href={`/${token}/edit`}
            className="flex items-center justify-center w-full bg-white/15 hover:bg-white/25 text-white font-bold px-6 py-3 rounded-2xl transition-colors text-sm backdrop-blur-sm"
          >
            Modifier cette fiche
          </Link>
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          Badge SOS par <a href="https://spoolio.fr" className="underline">Spoolio</a>
        </p>
      </div>
    </main>
  )
}
