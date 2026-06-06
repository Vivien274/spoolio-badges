import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Phone, AlertTriangle, Tent, Globe, MessageCircle } from 'lucide-react'
import { createServerClient } from '@/lib/supabase'
import Particles from '@/app/components/Particles'
import FicheEnfant from './FicheEnfant'
import FicheAnimal from './FicheAnimal'
import type { Fiche } from '@/lib/types'

type Props = { params: Promise<{ token: string }> }

const SPOOLIO_BLUE = '#1B4FD8'

async function getFiche(token: string): Promise<Fiche | null> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('fiches')
    .select('id, token, claim_code, password_hash, type, is_claimed, data, failed_attempts, locked_until, created_at, updated_at')
    .eq('token', token)
    .single()
  if (error || !data) return null
  return data as Fiche
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params
  const fiche = await getFiche(token)
  const type = fiche?.type ?? 'festivalier'
  const name =
    type === 'animal' ? fiche?.data?.nom :
    type === 'enfant' ? fiche?.data?.prenom :
    fiche?.data?.prenom
  const suffix =
    type === 'animal' ? 'Fiche animal SOS' :
    type === 'enfant' ? 'Fiche enfant SOS' :
    'Fiche SOS festivalier'
  return {
    title: name ? `${name} — ${suffix}` : `${suffix} — Spoolio Badge`,
    description: `${suffix} Spoolio`,
  }
}

export default async function FichePage({ params }: Props) {
  const { token } = await params
  const fiche = await getFiche(token)

  if (!fiche) notFound()

  if (!fiche.is_claimed) {
    return (
      <main
        className="flex flex-col items-center justify-center min-h-screen px-6 text-center"
        style={{ background: SPOOLIO_BLUE }}
      >
        <Particles />
        <div className="bg-white rounded-3xl p-8 max-w-xs w-full shadow-2xl">
          <div className="text-5xl mb-4">🏷️</div>
          <h1 className="text-xl font-black text-gray-800 mb-2">Badge pas encore activé</h1>
          <p className="text-gray-500 text-sm mb-6">
            Ce badge n&apos;a pas encore été configuré. Si c&apos;est le tien, active-le !
          </p>
          <Link
            href={`/${token}/edit`}
            className="block bg-lime-400 hover:bg-lime-500 text-gray-900 font-black px-6 py-3 rounded-2xl transition-colors"
          >
            Activer mon badge
          </Link>
        </div>
      </main>
    )
  }

  const type = fiche.type ?? 'festivalier'

  if (type === 'enfant') return <FicheEnfant fiche={fiche} />
  if (type === 'animal') return <FicheAnimal fiche={fiche} />

  // ── festivalier (default) ──
  const d = fiche.data
  const ticketNum = token.slice(-8).toUpperCase()

  // Barres de barcode (largeur px, hauteur %)
  const BARCODE: [number, number][] = [
    [2,100],[1,70],[3,100],[1,100],[2,70],[1,100],[1,70],[3,100],[1,70],[2,100],
    [1,100],[3,70],[2,100],[1,100],[1,70],[2,100],[3,70],[1,100],[2,70],[1,100],
    [1,70],[2,100],[1,70],[3,100],[1,100],[2,70],[1,100],[1,100],[3,70],[2,100],
    [1,100],[2,70],[1,100],[3,100],[1,70],[1,100],[2,70],[1,100],[2,100],[3,70],
  ]

  return (
    <main
      className="min-h-screen px-4 py-8 flex flex-col items-center"
      style={{ background: SPOOLIO_BLUE }}
    >
      <Particles />
      <div className="w-full max-w-sm">

        {/* ═══ TICKET ═══ */}
        <div className="relative">

          {/* ── TOP : lime green ── */}
          <div className="bg-lime-300 rounded-t-3xl relative overflow-hidden">
            {/* Rayures de sécurité diagonales */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: 'repeating-linear-gradient(45deg, rgba(0,0,0,0.045) 0px, rgba(0,0,0,0.045) 1px, transparent 1px, transparent 8px)',
              }}
            />
            <div className="relative z-10 px-6 pt-5 pb-10">
              {/* Label + numéro de ticket */}
              <div className="flex items-start justify-between mb-4">
                <p className="text-xs font-black uppercase tracking-widest text-lime-800">
                  Fiche SOS · Spoolio
                </p>
                <p className="font-mono text-xs font-bold text-lime-700 opacity-50 tracking-wider">
                  #{ticketNum}
                </p>
              </div>
              <div className="flex items-center gap-4">
                {d.photo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={d.photo_url}
                    alt={d.prenom ?? 'Photo'}
                    className="w-20 h-20 rounded-full object-cover border-4 border-white/60 shadow-lg flex-shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <h1 className="text-3xl font-black text-gray-900 leading-tight">
                    {d.prenom || 'Festivalier'}
                  </h1>
                  {d.intro && (
                    <p className="text-lime-800 text-sm italic mt-1 leading-snug">
                      &ldquo;{d.intro}&rdquo;
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── PERFORATIONS ── */}
          <div className="relative h-0 z-10">
            {/* Grandes encoches latérales */}
            <div className="absolute -left-3 -top-3.5 w-7 h-7 rounded-full" style={{ background: SPOOLIO_BLUE }} />
            <div className="absolute -right-3 -top-3.5 w-7 h-7 rounded-full" style={{ background: SPOOLIO_BLUE }} />
            {/* Petites perforations intérieures */}
            <div className="absolute left-6 right-6 -top-1 flex justify-between pointer-events-none">
              {Array.from({ length: 13 }).map((_, i) => (
                <div key={i} className="w-2 h-2 rounded-full" style={{ background: SPOOLIO_BLUE }} />
              ))}
            </div>
          </div>

          {/* ── BOTTOM : blanc ── */}
          <div className="bg-white rounded-b-3xl px-6 pb-4 pt-0">
            <div className="mb-5 pt-6" />

            <div className="space-y-4">

              {(d.contact1_nom || d.contact1_tel || d.contact2_nom || d.contact2_tel) && (
                <section>
                  <h2 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-gray-400 mb-2">
                    <Phone size={12} /> Contacts d&apos;urgence
                  </h2>
                  <div className="space-y-2">
                    {(d.contact1_nom || d.contact1_tel) && (
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-700 text-sm">{d.contact1_nom}</span>
                        {d.contact1_tel && (
                          <a href={`tel:${d.contact1_tel}`} className="text-red-500 font-black text-lg hover:underline">
                            {d.contact1_tel}
                          </a>
                        )}
                      </div>
                    )}
                    {(d.contact2_nom || d.contact2_tel) && (
                      <div className="flex items-center justify-between border-t border-gray-100 pt-2">
                        <span className="font-semibold text-gray-700 text-sm">{d.contact2_nom}</span>
                        {d.contact2_tel && (
                          <a href={`tel:${d.contact2_tel}`} className="text-red-500 font-black text-lg hover:underline">
                            {d.contact2_tel}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </section>
              )}

              {(d.infos_medicales || d.groupe_sanguin) && (
                <section className="border-t border-gray-100 pt-4">
                  <h2 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-gray-400 mb-2">
                    <AlertTriangle size={12} /> Infos médicales
                  </h2>
                  {d.groupe_sanguin && (
                    <span className="inline-block bg-amber-100 text-amber-800 font-black px-3 py-1 rounded-full text-xs mb-2">
                      Groupe {d.groupe_sanguin}
                    </span>
                  )}
                  {d.infos_medicales && (
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{d.infos_medicales}</p>
                  )}
                </section>
              )}

              {d.camping && (
                <section className="border-t border-gray-100 pt-4">
                  <h2 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-gray-400 mb-1">
                    <Tent size={12} /> Où je campe
                  </h2>
                  <p className="text-gray-700 text-sm">{d.camping}</p>
                </section>
              )}

              {d.langues && (
                <section className="border-t border-gray-100 pt-4">
                  <h2 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-gray-400 mb-1">
                    <Globe size={12} /> Langues
                  </h2>
                  <p className="text-gray-700 text-sm">{d.langues}</p>
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

            {/* ── Barcode décoratif ── */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="flex items-end gap-px w-full h-8 opacity-[0.18]">
                {BARCODE.map(([w, h], i) => (
                  <div
                    key={i}
                    className="bg-gray-900"
                    style={{ flexGrow: w, height: `${h}%` }}
                  />
                ))}
              </div>
              <p className="text-center text-[9px] font-mono tracking-[0.35em] text-gray-300 mt-1.5 uppercase">
                Spoolio Badge
              </p>
            </div>

          </div>
        </div>

        <div className="mt-4 space-y-2">
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
