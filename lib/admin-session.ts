import { cookies } from 'next/headers'

const COOKIE_NAME = 'spoolio_admin'
const MAX_AGE_S = 60 * 60 * 8 // 8h

async function getHmacKey(): Promise<CryptoKey> {
  const secret = (process.env.ADMIN_PASSWORD ?? 'fallback').padEnd(32, '0').slice(0, 32)
  const raw = new TextEncoder().encode(secret)
  return crypto.subtle.importKey('raw', raw, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}

async function sign(): Promise<string> {
  const key = await getHmacKey()
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + MAX_AGE_S * 1000 })).toString('base64url')
  const sig = Buffer.from(
    await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  ).toString('base64url')
  return `${payload}.${sig}`
}

async function verify(raw: string): Promise<boolean> {
  try {
    const dot = raw.lastIndexOf('.')
    if (dot === -1) return false
    const payload = raw.slice(0, dot)
    const sig = raw.slice(dot + 1)
    const key = await getHmacKey()
    const valid = await crypto.subtle.verify(
      'HMAC', key,
      Buffer.from(sig, 'base64url'),
      new TextEncoder().encode(payload)
    )
    if (!valid) return false
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString())
    return parsed.exp > Date.now()
  } catch {
    return false
  }
}

export async function setAdminSession(): Promise<void> {
  const value = await sign()
  const store = await cookies()
  store.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE_S,
    path: '/admin',
  })
}

export async function getAdminSession(): Promise<boolean> {
  const store = await cookies()
  const raw = store.get(COOKIE_NAME)?.value
  if (!raw) return false
  return verify(raw)
}

export async function clearAdminSession(): Promise<void> {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}
