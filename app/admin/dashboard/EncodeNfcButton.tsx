'use client'

import { useState } from 'react'

const BRIDGE_URL = 'http://localhost:8787/write'

type Status = 'idle' | 'pending' | 'success' | 'error'

export default function EncodeNfcButton({ url }: { url: string }) {
  const [status, setStatus] = useState<Status>('idle')
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
      setStatus('success')
      setTimeout(() => setStatus('idle'), 1500)
    } catch (err) {
      setStatus('error')
      setError(
        err instanceof TypeError
          ? 'Pont NFC introuvable. Lance "npm start" dans nfc-bridge/ et branche le lecteur.'
          : err instanceof Error ? err.message : 'Erreur inconnue.'
      )
    }
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <button
        type="button"
        onClick={handleEncode}
        disabled={status === 'pending'}
        className="text-emerald-600 hover:text-emerald-800 disabled:opacity-50 text-xs font-semibold transition-colors"
        title="Encoder la puce posée sur le lecteur ACR122U"
      >
        {status === 'pending' ? 'Encodage…' : status === 'success' ? '✓ Encodé' : '📡 Encoder'}
      </button>
      {status === 'error' && error && (
        <span className="text-red-500 text-xs" title={error}>⚠</span>
      )}
    </span>
  )
}
