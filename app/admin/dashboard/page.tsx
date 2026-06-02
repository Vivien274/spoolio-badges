import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getAdminSession } from '@/lib/admin-session'
import { adminLogout } from '../actions'
import { createServerClient } from '@/lib/supabase'
import GenerateForm from './GenerateForm'
import DeleteButton from './DeleteButton'
import CopyButton from './CopyButton'
import type { Fiche } from '@/lib/types'

async function getAllFiches(): Promise<Fiche[]> {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('fiches')
    .select('id, token, claim_code, is_claimed, data, failed_attempts, locked_until, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(500)
  return (data ?? []) as Fiche[]
}

export default async function DashboardPage() {
  const authenticated = await getAdminSession()
  if (!authenticated) redirect('/admin')

  const fiches = await getAllFiches()
  const total = fiches.length
  const claimed = fiches.filter((f) => f.is_claimed).length
  const unclaimed = total - claimed

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-lime-400 flex items-center justify-center text-sm font-black">S</div>
          <div>
            <p className="font-black text-gray-900 leading-none">Spoolio Badges</p>
            <p className="text-xs text-gray-400">Interface admin</p>
          </div>
        </div>
        <form action={adminLogout}>
          <button type="submit" className="text-sm text-gray-500 hover:text-gray-800 font-semibold transition-colors">
            Déconnexion
          </button>
        </form>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total</p>
            <p className="text-4xl font-black text-gray-900">{total}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Activées</p>
            <p className="text-4xl font-black text-lime-500">{claimed}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">En attente</p>
            <p className="text-4xl font-black text-amber-400">{unclaimed}</p>
          </div>
        </div>

        {/* ── Génération ── */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-black text-gray-900 mb-1">Générer des fiches</h2>
          <p className="text-sm text-gray-500 mb-4">Chaque fiche est créée avec un token unique et un claim code à remettre au client.</p>
          <GenerateForm />
        </div>

        {/* ── Liste ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-black text-gray-900">Toutes les fiches</h2>
            <p className="text-xs text-gray-400 mt-0.5">{total} fiche{total > 1 ? 's' : ''} · les 500 plus récentes</p>
          </div>

          {fiches.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400 text-sm">
              Aucune fiche pour l&apos;instant. Génère la première ci-dessus !
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-2 text-left font-semibold">Token</th>
                  <th className="px-6 py-2 text-left font-semibold">Claim code</th>
                  <th className="px-6 py-2 text-left font-semibold">Prénom</th>
                  <th className="px-6 py-2 text-left font-semibold">Statut</th>
                  <th className="px-6 py-2 text-left font-semibold">Créée le</th>
                  <th className="px-6 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {fiches.map((fiche) => (
                  <tr key={fiche.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center">
                        <Link
                          href={`/${fiche.token}`}
                          target="_blank"
                          className="font-mono text-xs text-blue-600 hover:underline"
                        >
                          {fiche.token}
                        </Link>
                        <CopyButton text={`https://badge.spoolio.fr/${fiche.token}/edit?claim=${fiche.claim_code ?? ''}`} />
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
                    <td className="px-6 py-3 text-gray-700 font-medium">
                      {fiche.data?.prenom ?? '—'}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        fiche.is_claimed
                          ? 'bg-lime-100 text-lime-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {fiche.is_claimed ? 'Activée' : 'En attente'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(fiche.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </td>
                    <td className="px-6 py-3">
                      <DeleteButton token={fiche.token} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </main>
    </div>
  )
}
