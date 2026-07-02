import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/admin-session'
import { adminLogout } from '../actions'
import { createServerClient } from '@/lib/supabase'
import GenerateForm from './GenerateForm'
import FichesTable from './FichesTable'
import type { Fiche } from '@/lib/types'

async function getAllFiches(): Promise<Fiche[]> {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('fiches')
    .select('id, token, claim_code, nfc_encoded_at, type, is_claimed, data, failed_attempts, locked_until, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(1000)
  return (data ?? []) as Fiche[]
}

export default async function DashboardPage() {
  const authenticated = await getAdminSession()
  if (!authenticated) redirect('/admin')

  const fiches = await getAllFiches()
  const total = fiches.length
  const activated = fiches.filter((f) => f.is_claimed && !f.claim_code).length
  const migrated = fiches.filter((f) => f.is_claimed && !!f.claim_code).length
  const pending = fiches.filter((f) => !f.is_claimed).length

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

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* ── Stats ── */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total</p>
            <p className="text-4xl font-black text-gray-900">{total}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Activées</p>
            <p className="text-4xl font-black text-lime-500">{activated}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Migrées</p>
            <p className="text-4xl font-black text-blue-500">{migrated}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">En attente</p>
            <p className="text-4xl font-black text-amber-400">{pending}</p>
          </div>
        </div>

        {/* ── Génération ── */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-black text-gray-900 mb-1">Générer des fiches</h2>
          <p className="text-sm text-gray-500 mb-4">Chaque fiche est créée avec un token unique et un claim code à remettre au client.</p>
          <GenerateForm />
        </div>

        {/* ── Liste ── */}
        <FichesTable fiches={fiches} />

      </main>
    </div>
  )
}
