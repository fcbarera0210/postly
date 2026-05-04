import { neon } from '@neondatabase/serverless'
import { resolveDatabaseUrl } from './resolve-database-url'

let sql: ReturnType<typeof neon> | null = null
let sqlForUrl: string | null = null

export function getSql() {
  const databaseUrl = resolveDatabaseUrl()
  if (!databaseUrl) {
    throw createError({ statusCode: 500, statusMessage: 'DATABASE_URL no está configurada' })
  }
  if (!sql || sqlForUrl !== databaseUrl) {
    sql = neon(databaseUrl)
    sqlForUrl = databaseUrl
  }
  return sql
}

export async function query<T = unknown>(queryText: string, params?: unknown[]): Promise<T[]> {
  const db = getSql()
  try {
    if (typeof (db as { query?: Function }).query === 'function') {
      if (params && params.length > 0) {
        const result = await (db as { query: (q: string, p: unknown[]) => Promise<{ rows?: T[] } | T[]> }).query(
          queryText,
          params
        )
        const r = result as { rows?: T[] } | T[]
        return (Array.isArray(r) ? r : r.rows || []) as T[]
      }
      const result = await (db as { query: (q: string) => Promise<{ rows?: T[] } | T[]> }).query(queryText)
      const r = result as { rows?: T[] } | T[]
      return (Array.isArray(r) ? r : r.rows || []) as T[]
    }

    if (params && params.length > 0) {
      const parts: string[] = []
      const values: unknown[] = []
      const regex = /\$(\d+)/g
      const matches: Array<{ index: number; paramNum: number }> = []
      let match
      while ((match = regex.exec(queryText)) !== null) {
        const paramNum = parseInt(match[1], 10)
        matches.push({ index: match.index, paramNum })
      }
      matches.forEach((m, idx) => {
        const start = idx === 0 ? 0 : matches[idx - 1].index + 2
        parts.push(queryText.substring(start, m.index))
        if (m.paramNum <= params.length) {
          values.push(params[m.paramNum - 1])
        }
      })
      if (matches.length > 0) {
        const lastMatch = matches[matches.length - 1]
        parts.push(queryText.substring(lastMatch.index + 2))
      } else {
        parts.push(queryText)
      }
      const templateFn = db as (parts: string[], ...values: unknown[]) => Promise<unknown>
      const result = await templateFn(parts, ...values)
      return Array.isArray(result) ? (result as T[]) : []
    }
    const tpl = Object.assign([queryText] as [string], { raw: [queryText] }) as unknown as TemplateStringsArray
    const result = await (db as (t: TemplateStringsArray, ...values: unknown[]) => Promise<unknown>)(tpl)
    return Array.isArray(result) ? (result as T[]) : []
  } catch (e) {
    throw e
  }
}

export async function queryOne<T = unknown>(queryText: string, params?: unknown[]): Promise<T | null> {
  const rows = await query<T>(queryText, params)
  return rows.length > 0 ? rows[0] : null
}
