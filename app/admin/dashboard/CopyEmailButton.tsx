'use client'

import { useState } from 'react'
import { buildActivationEmail } from './emailTemplate'
import type { Fiche } from '@/lib/types'

export default function CopyEmailButton({ fiche }: { fiche: Fiche }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    const { subject, body } = buildActivationEmail(fiche)
    const text = fiche.data?.email
      ? `À : ${fiche.data.email}\nObjet : ${subject}\n\n${body}`
      : `Objet : ${subject}\n\n${body}`
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="text-blue-500 hover:text-blue-700 text-xs font-semibold transition-colors"
      title="Copier l'email d'activation"
    >
      {copied ? '✓ Copié' : '✉ Email'}
    </button>
  )
}
