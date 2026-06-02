'use client'

import { useState } from 'react'

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
      className="ml-1.5 text-gray-300 hover:text-blue-500 transition-colors text-xs"
      title="Copier"
    >
      {copied ? '✓' : '⎘'}
    </button>
  )
}
