import { createHmac, timingSafeEqual } from 'node:crypto'

export function signJwt(sub: string, secret: string, maxAgeSec = 60 * 60 * 24 * 7): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(
    JSON.stringify({
      sub,
      exp: Math.floor(Date.now() / 1000) + maxAgeSec
    })
  ).toString('base64url')
  const sig = createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url')
  return `${header}.${payload}.${sig}`
}

export function verifyJwt(token: string, secret: string): { sub: string; exp: number } {
  const parts = token.split('.')
  if (parts.length !== 3) {
    throw new Error('invalid_token')
  }
  const [h, p, s] = parts
  const expected = createHmac('sha256', secret).update(`${h}.${p}`).digest('base64url')
  if (s.length !== expected.length || !timingSafeEqual(Buffer.from(s), Buffer.from(expected))) {
    throw new Error('invalid_token')
  }
  const payload = JSON.parse(Buffer.from(p, 'base64url').toString('utf8')) as { sub?: string; exp?: number }
  if (typeof payload.sub !== 'string' || typeof payload.exp !== 'number') {
    throw new Error('invalid_token')
  }
  if (payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('expired')
  }
  return { sub: payload.sub, exp: payload.exp }
}
