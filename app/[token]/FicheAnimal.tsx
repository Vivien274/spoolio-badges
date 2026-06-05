import Link from 'next/link'
import { Phone, AlertTriangle, MapPin, MessageCircle } from 'lucide-react'
import Particles from '@/app/components/Particles'
import type { Fiche } from '@/lib/types'

const BG = '#064E3B'       // vert forêt profond
const CARD_TOP = '#FEF3C7' // crème/sable chaud
const TEXT_TOP = '#92400E' // brun ambré

export default function FicheAnimal({ fiche }: { fiche: Fiche }) {
  const { token, data: d } = fiche

  const subtitle = [d.type_animal, d.race].filter(Boolean).join(' · ')

  return (
    <main
      className="min-h-screen px-4 py-8 flex flex-col items-center"
      style={{ background: BG }}
    >
      <Particles variant="animal" />
      <div className="w-full max-w-sm">

        <div className="relative">

          {/* ── TOP ── */}
          <div className="rounded-t-3xl px-6 pt-5 pb-10" style={{ background: CARD_TOP }}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🐾</span>
              <p className="text-xs font-black uppercase tracking-widest" style={{ color: TEXT_TOP }}>
                Fiche Animal SOS · Spoolio
              </p>
            </div>
            <div className="flex items-center gap-4">
              {d.photo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={d.photo_url}
                  alt={d.nom ?? 'Photo'}
                  className="w-20 h-20 rounded-full object-cover border-4 border-white/70 shadow-lg flex-shrink-0"
                />
              )}
              <div className="min-w-0">
                <h1 className="text-3xl font-black leading-tight" style={{ color: TEXT_TOP }}>
                  {d.nom || 'Animal'}
                </h1>
                {subtitle && (
                  <p className="text-sm mt-0.5 font-semibold" style={{ color: '#B45309' }}>{subtitle}</p>
                )}
              </div>
            </div>
          </div>

          {/* ── SÉPARATEUR ── */}
          <div className="relative h-0 z-10">
            <div className="absolute -left-3 -top-3.5 w-7 h-7 rounded-full" style={{ background: BG }} />
            <div className="absolute -right-3 -top-3.5 w-7 h-7 rounded-full" style={{ background: BG }} />
          </div>

          {/* ── BOTTOM ── */}
          <div className="bg-white rounded-b-3xl px-6 pb-6 pt-0">
            <div className="border-t-2 border-dashed border-amber-100 mx-2 mb-5 pt-5" />

            <div className="space-y-4">

              {(d.tel_proprio_1 || d.tel_proprio_2) && (
                <section>
                  <h2 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-700 mb-2">
                    <Phone size={12} /> Contacter le propriétaire
                  </h2>
                  <div className="space-y-2">
                    {d.tel_proprio_1 && (
                      <div className="flex items-center justify-between bg-amber-50 rounded-xl px-3 py-2">
                        <span className="font-semibold text-gray-700 text-sm">Téléphone 1</span>
                        <a href={`tel:${d.tel_proprio_1}`} className="font-black text-lg hover:underline text-amber-700">
                          {d.tel_proprio_1}
                        </a>
                      </div>
                    )}
                    {d.tel_proprio_2 && (
                      <div className="flex items-center justify-between bg-amber-50 rounded-xl px-3 py-2">
                        <span className="font-semibold text-gray-700 text-sm">Téléphone 2</span>
                        <a href={`tel:${d.tel_proprio_2}`} className="font-black text-lg hover:underline text-amber-700">
                          {d.tel_proprio_2}
                        </a>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {(d.veto_nom || d.veto_adresse) && (
                <section className="border-t border-gray-100 pt-4">
                  <h2 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-700 mb-2">
                    <MapPin size={12} /> Vétérinaire
                  </h2>
                  <div className="bg-emerald-50 rounded-xl px-3 py-2 space-y-0.5">
                    {d.veto_nom && <p className="font-semibold text-gray-700 text-sm">{d.veto_nom}</p>}
                    {d.veto_adresse && <p className="text-gray-600 text-sm">{d.veto_adresse}</p>}
                  </div>
                </section>
              )}

              {d.medical && (
                <section className="border-t border-gray-100 pt-4">
                  <h2 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-600 mb-2">
                    <AlertTriangle size={12} /> Infos médicales
                  </h2>
                  <p className="text-gray-700 text-sm whitespace-pre-wrap bg-amber-50 rounded-xl px-3 py-2">{d.medical}</p>
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
