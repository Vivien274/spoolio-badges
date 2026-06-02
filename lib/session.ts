import { cookies } from 'next/headers'

const COOKIE_NAME = 'spoolio_edit'
const MAX_AGE_S = 60 * 60 * 24 // 24 h

async function getHmacKey(): Promise<CryptoKey> {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY!
  // Dérive 32 octets à partir de la clé service_role
  const raw = new TextEncoder().encode(secret.slice(0, 32).padEnd(32, '0'))
  return crypto.subtle.importKey('raw', raw, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}

export async function createEditSession(token: string): Promise<string> {
  const key = await getHmacKey()
  const payload = Buffer.from(JSON.stringify({ token, exp: Date.now() + MAX_AGE_S * 1000 })).toString('base64url')
  const sig = Buffer.from(
    await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  ).toString('base64url')
  return `${payload}.${sig}`
}

export async function verifyEditSession(raw: string, token: string): Promise<boolean> {
  try {
    const dot = raw.lastIndexOf('.')
    if (dot === -1) return false
    const payload = raw.slice(0, dot)
    const sig = raw.slice(dot + 1)
    const key = await getHmacKey()
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      Buffer.from(sig, 'base64url'),
      new TextEncoder().encode(payload)
    )
    if (!valid) return false
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString())
    return parsed.token === token && parsed.exp > Date.now()
  } catch {
    return false
  }
}

export async function getEditSession(token: string): Promise<boolean> {
  const store = await cookies()
  const raw = store.get(COOKIE_NAME)?.value
  if (!raw) return false
  return verifyEditSession(raw, token)
}

export async function setEditSession(token: string): Promise<void> {
  const value = await createEditSession(token)
  const store = await cookies()
  store.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE_S,
    path: '/',
  })
}
