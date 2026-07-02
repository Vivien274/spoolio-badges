'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Nfc, Check, Loader2 } from 'lucide-react'
import { markFicheEncoded } from '../actions'

const BRIDGE_URL = 'http://localhost:8787/write'

type Status = 'idle' | 'pending' | 'success' | 'error'

interface Props {
  token: string
  url: string
  encodedAt?: string | null
}

export default function EncodeNfcButton({ token, url, encodedAt = null }: Props) {
  const router = useRouter()
  const [status, setStatus] = useState<Status>('idle')
  const [lastEncodedAt, setLastEncodedAt] = useState<string | null>(encodedAt)
  const [error, setError] = useState<string | null>(null)

  async function handleEncode() {
    setStatus('pending')
    setError(null)
    try {
      const res = await fetch(BRIDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erreur inconnue.')

      const mark = await markFicheEncoded(token)
      if (mark.error) throw new Error(mark.error)

      setLastEncodedAt(mark.encodedAt ?? new Date().toISOString())
      setStatus('success')
      router.refresh()
    } catch (err) {
      setStatus('error')
      setError(
        err instanceof TypeError
          ? 'Pont NFC introuvable. Lance "npm start" dans nfc-bridge/ et branche le lecteur.'
          : err instanceof Error ? err.message : 'Erreur inconnue.'
      )
      setTimeout(() => setStatus('idle'), 2500)
    }
  }

  const isEncoded = !!lastEncodedAt
  const label = status === 'pending' ? 'Encodage…' : isEncoded ? 'Réencoder' : 'Encoder'
  const color =
    status === 'error' ? 'text-red-500 hover:text-red-600' :
    status === 'success' || isEncoded ? 'text-lime-600 hover:text-lime-700' :
    'text-emerald-500 hover:text-emerald-700'
  const title =
    status === 'error'
      ? error ?? 'Erreur'
      : isEncoded && lastEncodedAt
      ? `Déjà encodé le ${new Date(lastEncodedAt).toLocaleString('fr-FR')}. Cliquer pour réencoder.`
      : 'Encoder la puce posée sur le lecteur ACR122U'

  return (
    <button
      type="button"
      onClick={handleEncode}
      disabled={status === 'pending'}
      className={`transition-colors disabled:opacity-50 flex-shrink-0 inline-flex items-center gap-1.5 ${color}`}
      title={title}
    >
      {status === 'pending' ? <Loader2 size={14} className="animate-spin" /> : status === 'success' || isEncoded ? <Check size={14} /> : <Nfc size={14} />}
      <span className="text-xs font-semibold">{label}</span>
    </button>
  )
}
