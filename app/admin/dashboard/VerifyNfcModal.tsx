'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Nfc, AlertTriangle, CheckCircle2, RotateCcw, X, ShieldAlert, Cpu, Sparkles, Loader2 } from 'lucide-react'
import { markFicheEncoded } from '../actions'
import type { Fiche } from '@/lib/types'

const BRIDGE_URL = 'http://localhost:8787'

interface ScannedCard {
  id: number
  scanId: number
  uid: string
  url: string | null
  timestamp: string
  isDuplicateUrl: boolean
  isDuplicateUid: boolean
  firstSeenIndex?: number
}

interface Props {
  fiches: Fiche[]
}

export default function VerifyNfcModal({ fiches }: Props) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [bridgeConnected, setBridgeConnected] = useState(false)
  const [readerName, setReaderName] = useState<string | null>(null)
  const [cardPresent, setCardPresent] = useState(false)
  const [currentCardOnReader, setCurrentCardOnReader] = useState<{ uid: string; url: string | null } | null>(null)
  const [cards, setCards] = useState<ScannedCard[]>([])
  
  // Pour le réencodage direct
  const [selectedTokenToEncode, setSelectedTokenToEncode] = useState<string>('')
  const [isEncoding, setIsEncoding] = useState(false)
  const [encodeMessage, setEncodeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const lastScanIdRef = useRef<number | null>(null)

  // Liste des fiches non encore encodées en base
  const availableUnencodedFiches = useMemo(() => {
    return fiches.filter((f) => !f.nfc_encoded_at)
  }, [fiches])

  // Définir la première fiche libre par défaut
  useEffect(() => {
    if (availableUnencodedFiches.length > 0 && !selectedTokenToEncode) {
      setSelectedTokenToEncode(availableUnencodedFiches[0].token)
    }
  }, [availableUnencodedFiches, selectedTokenToEncode])

  // Polling du pont local lorsque la modale est ouverte
  useEffect(() => {
    if (!isOpen) return

    let isMounted = true

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${BRIDGE_URL}/status`, { signal: AbortSignal.timeout(1000) })
        if (!res.ok) throw new Error('Status non ok')
        const data = await res.json()

        if (!isMounted) return
        setBridgeConnected(true)
        setReaderName(data.readerName)
        setCardPresent(data.cardPresent)

        const current = data.currentCard
        if (current) {
          setCurrentCardOnReader({ uid: current.uid, url: current.url })
        } else {
          setCurrentCardOnReader(null)
        }

        if (current && current.scanId && current.scanId !== lastScanIdRef.current) {
          lastScanIdRef.current = current.scanId

          setCards((prev) => {
            const url = current.url
            const uid = current.uid
            
            // Chercher s'il existe déjà une puce avec la même URL ou le même UID
            const duplicateUrlCard = url ? prev.find((c) => c.url === url) : undefined
            const duplicateUidCard = uid ? prev.find((c) => c.uid === uid) : undefined

            const newCard: ScannedCard = {
              id: prev.length + 1,
              scanId: current.scanId,
              uid,
              url,
              timestamp: new Date().toLocaleTimeString('fr-FR'),
              isDuplicateUrl: !!duplicateUrlCard,
              isDuplicateUid: !!duplicateUidCard,
              firstSeenIndex: duplicateUrlCard ? duplicateUrlCard.id : (duplicateUidCard ? duplicateUidCard.id : undefined),
            }

            return [newCard, ...prev]
          })
        }
      } catch {
        if (!isMounted) return
        setBridgeConnected(false)
        setReaderName(null)
        setCardPresent(false)
        setCurrentCardOnReader(null)
      }
    }, 300)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [isOpen])

  function handleReset() {
    setCards([])
    lastScanIdRef.current = null
    setEncodeMessage(null)
    fetch(`${BRIDGE_URL}/clear-history`, { method: 'POST' }).catch(() => {})
  }

  // Réencoder la puce actuellement sur le lecteur
  async function handleDirectReencode() {
    if (!selectedTokenToEncode || !cardPresent) return
    setIsEncoding(true)
    setEncodeMessage(null)

    const targetUrl = `https://badge.spoolio.fr/${selectedTokenToEncode}`

    try {
      const res = await fetch(`${BRIDGE_URL}/write`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erreur lors de l’écriture.')

      const mark = await markFicheEncoded(selectedTokenToEncode)
      if (mark.error) throw new Error(mark.error)

      setEncodeMessage({
        type: 'success',
        text: `✅ Puce réencodée avec succès vers ${selectedTokenToEncode.slice(0, 10)}… !`,
      })

      router.refresh()
    } catch (err) {
      setEncodeMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Erreur inconnue.',
      })
    } finally {
      setIsEncoding(false)
    }
  }

  const { total, duplicates, uniques } = useMemo(() => {
    const total = cards.length
    const duplicates = cards.filter((c) => c.isDuplicateUrl || c.isDuplicateUid).length
    const uniques = total - duplicates
    return { total, duplicates, uniques }
  }, [cards])

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 bg-gray-900 hover:bg-black text-white font-bold px-4 py-2 rounded-xl transition-colors text-sm shadow-sm"
      >
        <Nfc size={16} className="text-lime-400" />
        Vérifier les puces NFC
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
            
            {/* ── En-tête ── */}
            <div className="bg-lime-300 px-6 py-4 flex items-center justify-between border-b border-lime-400">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gray-900 text-lime-400 flex items-center justify-center shadow-sm">
                  <Nfc size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-900">Vérificateur & Réencodeur de puces</h2>
                  <p className="text-xs text-lime-900 font-medium">Contrôle chaque puce et réencode immédiatement celles en doublon ou erreur</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 text-gray-900 flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* ── Bandeau d'état matériel ── */}
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${bridgeConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                {bridgeConnected ? (
                  <span className="text-gray-700">
                    Lecteur : <strong className="text-gray-900">{readerName ?? 'ACS ACR122U'}</strong>
                  </span>
                ) : (
                  <span className="text-red-600">
                    Pont NFC non détecté (lance &quot;npm start&quot; dans nfc-bridge)
                  </span>
                )}
              </div>

              {bridgeConnected && (
                <div className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${cardPresent ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'}`}>
                  {cardPresent ? 'Puce posée sur le lecteur' : 'En attente d’une puce…'}
                </div>
              )}
            </div>

            {/* ── Zone Réencodage si une puce est posée ── */}
            {cardPresent && (
              <div className="bg-amber-50/70 border-b border-amber-200 px-6 py-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-900">
                    <Sparkles size={14} className="text-amber-600" />
                    Puce actuellement sur le lecteur
                  </div>
                  <span className="font-mono text-xs font-bold text-amber-800">
                    UID : {currentCardOnReader?.uid}
                  </span>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex-1 min-w-[240px]">
                    <label className="block text-[11px] font-semibold text-gray-500 mb-0.5">
                      Choisir une fiche non encore encodée pour cette puce :
                    </label>
                    <select
                      value={selectedTokenToEncode}
                      onChange={(e) => setSelectedTokenToEncode(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-xs font-mono font-medium focus:ring-2 focus:ring-lime-400"
                    >
                      {availableUnencodedFiches.length === 0 ? (
                        <option value="">Toutes les fiches actuelles sont déjà encodées</option>
                      ) : (
                        availableUnencodedFiches.map((f) => (
                          <option key={f.token} value={f.token}>
                            {f.type.toUpperCase()} · Token: {f.token.slice(0, 12)}… ({f.data?.ref || f.data?.prenom || 'Nouvelle fiche'})
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleDirectReencode}
                    disabled={isEncoding || !selectedTokenToEncode || availableUnencodedFiches.length === 0}
                    className="mt-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-black px-4 py-2 rounded-xl text-xs transition-colors shadow-xs flex items-center gap-1.5 whitespace-nowrap"
                  >
                    {isEncoding ? <Loader2 size={13} className="animate-spin" /> : <Nfc size={13} />}
                    {isEncoding ? 'Écriture…' : 'Écrire cette fiche sur la puce'}
                  </button>
                </div>

                {encodeMessage && (
                  <p className={`text-xs font-bold ${encodeMessage.type === 'success' ? 'text-emerald-700' : 'text-red-600'}`}>
                    {encodeMessage.text}
                  </p>
                )}
              </div>
            )}

            {/* ── Compteurs ── */}
            <div className="px-6 py-3 border-b border-gray-100 grid grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-2xl p-2.5 border border-gray-100 text-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total lues</p>
                <p className="text-xl font-black text-gray-900 mt-0.5">{total}</p>
              </div>
              <div className="bg-emerald-50 rounded-2xl p-2.5 border border-emerald-100 text-center">
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Uniques</p>
                <p className="text-xl font-black text-emerald-700 mt-0.5">{uniques}</p>
              </div>
              <div className={`rounded-2xl p-2.5 border text-center transition-colors ${
                duplicates > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'
              }`}>
                <p className={`text-[10px] font-bold uppercase tracking-wider ${duplicates > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                  Doublons
                </p>
                <p className={`text-xl font-black mt-0.5 ${duplicates > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                  {duplicates}
                </p>
              </div>
            </div>

            {/* ── Liste des lectures ── */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2.5 min-h-56 max-h-80">
              {cards.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center text-gray-400 space-y-2">
                  <Cpu size={32} className="text-gray-300 animate-bounce" />
                  <p className="font-bold text-sm text-gray-600">Pose une puce sur le lecteur ACR122U</p>
                  <p className="text-xs max-w-xs">Chaque puce passée s’affiche ici avec son URL et son statut pour repérer tout doublon.</p>
                </div>
              ) : (
                cards.map((c) => {
                  const isDup = c.isDuplicateUrl || c.isDuplicateUid
                  const token = c.url ? c.url.split('/').pop() : null
                  const matchingFiche = token ? fiches.find((f) => f.token === token) : null

                  return (
                    <div
                      key={c.scanId}
                      className={`rounded-2xl p-3 border transition-all ${
                        isDup
                          ? 'bg-red-50 border-red-300 ring-2 ring-red-400 shadow-md'
                          : 'bg-white border-gray-200 hover:border-gray-300 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-md text-[11px] font-black flex items-center justify-center ${
                            isDup ? 'bg-red-600 text-white' : 'bg-gray-900 text-white'
                          }`}>
                            #{c.id}
                          </span>
                          <span className="font-mono text-xs text-gray-700 font-bold">
                            UID : {c.uid}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {c.timestamp}
                          </span>
                        </div>

                        {/* Badge de statut */}
                        {isDup ? (
                          <div className="inline-flex items-center gap-1 bg-red-600 text-white px-2 py-0.5 rounded-full text-xs font-black tracking-wide shadow-xs">
                            <ShieldAlert size={12} />
                            DOUBLON #{c.firstSeenIndex}
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-xs font-bold">
                            <CheckCircle2 size={12} />
                            Unique
                          </div>
                        )}
                      </div>

                      {/* URL lue */}
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <div className="font-mono text-xs truncate">
                          {c.url ? (
                            <span className={isDup ? 'font-bold text-red-700' : 'text-gray-800'}>
                              {c.url}
                            </span>
                          ) : (
                            <span className="text-amber-600 italic">
                              ⚠️ Puce vide ou non encodée en NDEF
                            </span>
                          )}
                        </div>
                        {matchingFiche && (
                          <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md flex-shrink-0">
                            {matchingFiche.type} {matchingFiche.data?.ref ? `(${matchingFiche.data.ref})` : ''}
                          </span>
                        )}
                      </div>

                      {/* Explication du doublon */}
                      {isDup && (
                        <div className="mt-2 text-xs font-semibold text-red-700 bg-red-100/70 rounded-xl px-2.5 py-1 flex items-center gap-1.5">
                          <AlertTriangle size={13} className="flex-shrink-0" />
                          <span>
                            {c.isDuplicateUrl && c.isDuplicateUid
                              ? `Même puce physique déjà passée (identique à la puce #${c.firstSeenIndex})`
                              : c.isDuplicateUrl
                              ? `ATTENTION : Deux puces différentes portent la même URL ! (Déjà vu sur #${c.firstSeenIndex})`
                              : `Même UID physique réutilisé`}
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            {/* ── Pied de modal ── */}
            <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handleReset}
                disabled={cards.length === 0}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 disabled:opacity-40 transition-colors"
              >
                <RotateCcw size={13} />
                Réinitialiser la liste
              </button>

              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">
                  {availableUnencodedFiches.length} fiche{availableUnencodedFiches.length > 1 ? 's' : ''} libre{availableUnencodedFiches.length > 1 ? 's' : ''} en attente d&apos;encodage
                </span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="bg-gray-900 hover:bg-black text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  )
}
