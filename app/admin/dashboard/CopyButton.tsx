'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="text-gray-300 hover:text-blue-500 transition-colors flex-shrink-0"
      title="Copier"
    >
      {copied ? <Check size={13} className="text-lime-500" /> : <Copy size={13} />}
    </button>
  )
}
