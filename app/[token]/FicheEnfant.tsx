import Link from 'next/link'
import { AlertTriangle, MessageCircle } from 'lucide-react'
import Particles from '@/app/components/Particles'
import type { Fiche } from '@/lib/types'

const BG = '#7C3AED'

export default function FicheEnfant({ fiche }: { fiche: Fiche }) {
  const { token, data: d } = fiche

  return (
    <main
      className="min-h-screen px-4 py-8 flex flex-col items-center justify-start"
      style={{ background: BG }}
    >
      <Particles variant="enfant" />
      <div className="w-full max-w-sm relative z-10">

        {/* ═══ CARTE ═══ */}
        <div className="rounded-3xl overflow-hidden shadow-2xl">

          {/* ── Header gradient ── */}
          <div
            className="px-6 pt-6 pb-8 text-center"
            style={{ background: 'linear-gradient(160deg, #FDE68A 0%, #FB923C 100%)' }}
          >
            <p className="text-xs font-black uppercase tracking-widest text-orange-800 mb-4">
              ✋ Fiche Enfant SOS · Spoolio
            </p>

            {/* Photo */}
            <div className="flex justify-center mb-4">
              {d.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={d.photo_url}
                  alt={d.prenom ?? 'Photo'}
                  className="w-28 h-28 rounded-full object-cover shadow-xl"
                  style={{ border: '5px solid white' }}
                />
              ) : (
                <div
                  className="w-28 h-28 rounded-full bg-orange-100 flex items-center justify-center text-5xl shadow-xl"
                  style={{ border: '5px solid white' }}
                >
                  👶
                </div>
              )}
            </div>

            <h1 className="text-4xl font-black text-orange-900 leading-tight">
              {d.prenom || 'Enfant'}
            </h1>
            {d.message && (
              <p className="text-orange-800 text-sm mt-2 italic leading-snug">
                &ldquo;{d.message}&rdquo;
              </p>
            )}
          </div>

          {/* ── Corps blanc ── */}
          <div className="bg-white px-5 pb-6 pt-5 space-y-4">

            {/* Appel parents — boutons grands */}
            {(d.tel_parent_1 || d.tel_parent_2) && (
              <section>
                <p className="text-xs font-black uppercase tracking-wider text-violet-500 mb-3">
                  📞 Appelle mes parents !
                </p>
                <div className="space-y-2">
                  {d.tel_parent_1 && (
                    <a
                      href={`tel:${d.tel_parent_1}`}
                      className="flex items-center justify-between w-full rounded-2xl px-4 py-3.5 font-black text-white text-lg transition-opacity hover:opacity-90 active:opacity-75"
                      style={{ background: '#7C3AED' }}
                    >
                      <span className="text-sm font-bold opacity-80">Parent 1</span>
                      <span>{d.tel_parent_1}</span>
                    </a>
                  )}
                  {d.tel_parent_2 && (
                    <a
                      href={`tel:${d.tel_parent_2}`}
                      className="flex items-center justify-between w-full rounded-2xl px-4 py-3.5 font-black text-violet-800 text-lg transition-opacity hover:opacity-90 active:opacity-75"
                      style={{ background: '#EDE9FE' }}
                    >
                      <span className="text-sm font-bold opacity-70">Parent 2</span>
                      <span>{d.tel_parent_2}</span>
                    </a>
                  )}
                </div>
              </section>
            )}

            {/* Infos médicales */}
            {d.medical && (
              <section className="border-t border-gray-100 pt-4">
                <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-600 mb-2">
                  <AlertTriangle size={12} /> Infos médicales importantes
                </p>
                <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-xl px-3 py-2.5">
                  <p className="text-gray-800 text-sm whitespace-pre-wrap">{d.medical}</p>
                </div>
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
