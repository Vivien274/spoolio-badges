import Link from 'next/link'
import { Phone, AlertTriangle, MapPin, MessageCircle } from 'lucide-react'
import Particles from '@/app/components/Particles'
import type { Fiche } from '@/lib/types'

const SPOOLIO_BLUE = '#1B4FD8'

export default function FicheAnimal({ fiche }: { fiche: Fiche }) {
  const { token, data: d } = fiche

  const subtitle = [d.type_animal, d.race].filter(Boolean).join(' · ')

  return (
    <main
      className="min-h-screen px-4 py-8 flex flex-col items-center"
      style={{ background: SPOOLIO_BLUE }}
    >
      <Particles />
      <div className="w-full max-w-sm">

        <div className="relative">

          {/* ── TOP ── */}
          <div className="bg-lime-300 rounded-t-3xl px-6 pt-5 pb-10">
            <p className="text-xs font-black uppercase tracking-widest text-lime-800 mb-4">
              Fiche Animal SOS · Spoolio
            </p>
            <div className="flex items-center gap-4">
              {d.photo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={d.photo_url}
                  alt={d.nom ?? 'Photo'}
                  className="w-20 h-20 rounded-full object-cover border-4 border-white/60 shadow-lg flex-shrink-0"
                />
              )}
              <div className="min-w-0">
                <h1 className="text-3xl font-black text-gray-900 leading-tight">
                  {d.nom || 'Animal'}
                </h1>
                {subtitle && (
                  <p className="text-lime-800 text-sm mt-0.5">{subtitle}</p>
                )}
              </div>
            </div>
          </div>

          {/* ── SÉPARATEUR ── */}
          <div className="relative h-0 z-10">
            <div className="absolute -left-3 -top-3.5 w-7 h-7 rounded-full" style={{ background: SPOOLIO_BLUE }} />
            <div className="absolute -right-3 -top-3.5 w-7 h-7 rounded-full" style={{ background: SPOOLIO_BLUE }} />
          </div>

          {/* ── BOTTOM ── */}
          <div className="bg-white rounded-b-3xl px-6 pb-6 pt-0">
            <div className="border-t-2 border-dashed border-gray-200 mx-2 mb-5 pt-5" />

            <div className="space-y-4">

              {(d.tel_proprio_1 || d.tel_proprio_2) && (
                <section>
                  <h2 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-gray-400 mb-2">
                    <Phone size={12} /> Propriétaire
                  </h2>
                  <div className="space-y-2">
                    {d.tel_proprio_1 && (
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-700 text-sm">Téléphone 1</span>
                        <a href={`tel:${d.tel_proprio_1}`} className="text-red-500 font-black text-lg hover:underline">
                          {d.tel_proprio_1}
                        </a>
                      </div>
                    )}
                    {d.tel_proprio_2 && (
                      <div className="flex items-center justify-between border-t border-gray-100 pt-2">
                        <span className="font-semibold text-gray-700 text-sm">Téléphone 2</span>
                        <a href={`tel:${d.tel_proprio_2}`} className="text-red-500 font-black text-lg hover:underline">
                          {d.tel_proprio_2}
                        </a>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {(d.veto_nom || d.veto_adresse) && (
                <section className="border-t border-gray-100 pt-4">
                  <h2 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-gray-400 mb-2">
                    <MapPin size={12} /> Vétérinaire
                  </h2>
                  {d.veto_nom && <p className="font-semibold text-gray-700 text-sm">{d.veto_nom}</p>}
                  {d.veto_adresse && <p className="text-gray-600 text-sm mt-0.5">{d.veto_adresse}</p>}
                </section>
              )}

              {d.medical && (
                <section className="border-t border-gray-100 pt-4">
                  <h2 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-gray-400 mb-2">
                    <AlertTriangle size={12} /> Infos médicales
                  </h2>
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{d.medical}</p>
                </section>
              )}

              {d.message && (
                <section className="border-t border-gray-100 pt-4">
                  <h2 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-gray-400 mb-1">
                    <MessageCircle size={12} /> Message
                  </h2>
                  <p className="text-gray-700 text-sm italic">{d.message}</p>
                </section>
              )}

            </div>
          </div>
        </div>

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
