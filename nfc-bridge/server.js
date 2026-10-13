/**
 * Pont local entre le lecteur ACR122U et l'admin Spoolio Badges.
 *
 * Usage :
 *   cd nfc-bridge
 *   npm install
 *   npm start
 *
 * Branche le lecteur, pose une puce NTAG21x (213/215/216) dessus, puis
 * clique "Encoder" dans l'admin. Le pont écrit ou lit l'URL en NDEF (record URI)
 * à partir de la page 4.
 */

const { createServer } = require('node:http')
const { NFC } = require('nfc-pcsc')

const PORT = 8787
const ALLOWED_ORIGINS = new Set([
  'https://badge.spoolio.fr',
])

// Codes d'identifiant d'URI (NFC Forum URI Record Type Definition)
const URI_PREFIXES = [
  ['https://www.', 0x02],
  ['http://www.', 0x01],
  ['https://', 0x04],
  ['http://', 0x03],
  ['tel:', 0x05],
  ['mailto:', 0x06],
]

function buildNdefUriPage(url) {
  let code = 0x00
  let rest = url
  for (const [prefix, c] of URI_PREFIXES) {
    if (url.startsWith(prefix)) {
      code = c
      rest = url.slice(prefix.length)
      break
    }
  }

  const payload = Buffer.concat([Buffer.from([code]), Buffer.from(rest, 'ascii')])
  const type = Buffer.from('U', 'ascii')
  const record = Buffer.concat([
    Buffer.from([0xd1, type.length, payload.length]), // header, type length, payload length
    type,
    payload,
  ])

  if (record.length > 254) throw new Error('URL trop longue pour ce format NDEF.')

  // TLV Type 2 Tag : tag NDEF (0x03) + longueur + message + terminateur (0xFE)
  const tlv = Buffer.concat([Buffer.from([0x03, record.length]), record, Buffer.from([0xfe])])

  // Pages de 4 octets : on complète avec des zéros
  const padded = Buffer.alloc(Math.ceil(tlv.length / 4) * 4)
  tlv.copy(padded)
  return padded
}

function parseNdefUri(buffer) {
  if (!buffer || buffer.length < 7) return null

  for (let i = 0; i < buffer.length - 6; i++) {
    if (buffer[i] === 0x03 && buffer[i + 2] === 0xd1 && buffer[i + 3] === 0x01 && buffer[i + 5] === 0x55) {
      const payloadLen = buffer[i + 4]
      const code = buffer[i + 6]
      const rest = buffer.slice(i + 7, i + 6 + payloadLen).toString('ascii')
      const prefixMap = {
        0x01: 'http://www.',
        0x02: 'https://www.',
        0x03: 'http://',
        0x04: 'https://',
        0x05: 'tel:',
        0x06: 'mailto:',
      }
      return (prefixMap[code] || '') + rest
    }
  }

  const str = buffer.toString('utf-8')
  const match = str.match(/https?:\/\/[a-zA-Z0-9.\-_~:\/?#\[\]@!$&'()*+,;=]+/)
  if (match) return match[0]
  return null
}

let activeReader = null
let cardPresent = false
let currentCard = null
let scanCounter = 0
const scanHistory = []

const nfc = new NFC()

nfc.on('reader', (reader) => {
  console.log(`Lecteur connecté : ${reader.reader.name}`)
  activeReader = reader

  reader.on('card', async (card) => {
    cardPresent = true
    const scanId = ++scanCounter
    currentCard = { scanId, uid: card.uid, url: null, timestamp: new Date().toISOString() }
    
    // Lire le contenu de la puce (page 4 sur 64 octets)
    try {
      const data = await reader.read(4, 64)
      const url = parseNdefUri(data)
      currentCard.url = url
      scanHistory.push({ scanId, uid: card.uid, url, timestamp: currentCard.timestamp })

      if (url) {
        console.log(`[LECTURE #${scanId}] Puce UID: ${card.uid} -> ${url}`)
      } else {
        console.log(`[LECTURE #${scanId}] Puce UID: ${card.uid} -> Non encodée / vide`)
      }
    } catch (err) {
      console.log(`[LECTURE #${scanId}] Puce UID: ${card.uid} - Erreur : ${err.message}`)
    }
  })

  reader.on('card.off', () => {
    cardPresent = false
    currentCard = null
    console.log('Puce retirée.')
  })

  reader.on('error', (err) => {
    console.error('Erreur lecteur :', err.message)
  })

  reader.on('end', () => {
    console.log('Lecteur déconnecté.')
    activeReader = null
    cardPresent = false
    currentCard = null
  })
})

nfc.on('error', (err) => {
  console.error('Erreur NFC :', err.message)
})

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

function isAllowedOrigin(origin) {
  if (!origin) return false
  if (ALLOWED_ORIGINS.has(origin)) return true

  try {
    const url = new URL(origin)
    return ['localhost', '127.0.0.1'].includes(url.hostname)
  } catch {
    return false
  }
}

const server = createServer((req, res) => {
  const origin = req.headers.origin
  if (isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  if (req.method === 'GET' && req.url === '/status') {
    send(res, 200, {
      readerConnected: !!activeReader,
      readerName: activeReader?.reader?.name || null,
      cardPresent,
      currentCard,
      history: scanHistory,
    })
    return
  }

  if (req.method === 'GET' && req.url === '/read') {
    if (!activeReader || !cardPresent) {
      send(res, 409, { error: 'Aucune puce détectée sur le lecteur.' })
      return
    }
    send(res, 200, {
      success: true,
      card: currentCard,
    })
    return
  }

  if (req.method === 'POST' && req.url === '/clear-history') {
    scanHistory.length = 0
    send(res, 200, { success: true })
    return
  }

  if (req.method === 'POST' && req.url === '/write') {
    let body = ''
    req.on('data', (chunk) => { body += chunk })
    req.on('end', async () => {
      try {
        const { url } = JSON.parse(body || '{}')
        if (!url || typeof url !== 'string') {
          send(res, 400, { error: 'URL manquante.' })
          return
        }
        if (!activeReader || !cardPresent) {
          send(res, 409, { error: 'Aucune puce détectée. Pose-la sur le lecteur et réessaie.' })
          return
        }
        const data = buildNdefUriPage(url)
        await activeReader.write(4, data)
        send(res, 200, { success: true })
      } catch (err) {
        send(res, 500, { error: err.message || 'Erreur inconnue.' })
      }
    })
    return
  }

  send(res, 404, { error: 'Not found.' })
})

server.listen(PORT, () => {
  console.log(`Pont NFC démarré sur http://localhost:${PORT}`)
  console.log("Branche le lecteur ACR122U, pose une puce, puis clique \"Encoder\" ou utilise le vérificateur.")
})
