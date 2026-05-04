import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

let dotenvCache: Record<string, string> | null = null

/**
 * Lee .env / .env.local desde la raíz del proyecto (Nitro a vece aún no ha volcado todo a process.env).
 */
function parseDotEnvFiles(): Record<string, string> {
  if (dotenvCache) return dotenvCache
  dotenvCache = {}
  const paths = [join(process.cwd(), '.env.local'), join(process.cwd(), '.env')]
  for (const p of paths) {
    if (!existsSync(p)) continue
    try {
      const text = readFileSync(p, 'utf8')
      for (const line of text.split('\n')) {
        const t = line.trim()
        if (!t || t.startsWith('#')) continue
        const eq = t.indexOf('=')
        if (eq === -1) continue
        const key = t.slice(0, eq).trim()
        let val = t.slice(eq + 1).trim()
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1)
        }
        dotenvCache[key] = val
      }
    } catch {
      /* ignore */
    }
  }
  return dotenvCache
}

const ENV_KEYS = ['NUXT_DATABASE_URL', 'DATABASE_URL', 'DATABASE_URL_UNPOOLED'] as const

function pickUrlFromRecord(rec: Record<string, string>): string {
  for (const k of ENV_KEYS) {
    const v = rec[k]?.trim()
    if (v) return v
  }
  return ''
}

/**
 * Neon: el host con `-pooler` usa PgBouncer; el DDL (CREATE TABLE / ALTER) debe hacerse contra el endpoint **directo**.
 * @see https://neon.tech/docs/connect/connection-pooling
 */
export function toNeonDirectConnectionUrl(url: string): string {
  if (!url || !url.includes('-pooler.')) return url
  try {
    const u = new URL(url)
    u.hostname = u.hostname.replace('-pooler.', '.')
    return u.toString()
  } catch {
    return url
  }
}

/**
 * URL para consultas normales (pooler OK).
 */
export function resolveDatabaseUrl(): string {
  for (const k of ENV_KEYS) {
    const v = process.env[k]?.trim()
    if (v) return v
  }
  const fromFile = pickUrlFromRecord(parseDotEnvFiles())
  if (fromFile) return fromFile
  try {
    const config = useRuntimeConfig()
    return ((config.databaseUrl as string) || '').trim()
  } catch {
    return ''
  }
}

/**
 * URL para migraciones DDL (sin pooler).
 */
export function resolveDatabaseUrlForMigrations(): string {
  const base = resolveDatabaseUrl()
  if (!base) return ''
  return toNeonDirectConnectionUrl(base)
}
