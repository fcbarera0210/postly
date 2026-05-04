/**
 * Carga .env, ejecuta database/reset_neon.sql y database/schema.sql contra Neon.
 * Uso: node scripts/apply-neon-schema.mjs
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { neon } from '@neondatabase/serverless'
import { pickDatabaseUrl, toDirectNeonUrl } from './neon-url.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

function loadEnv() {
  for (const name of ['.env', '.env.local']) {
    try {
      const p = join(root, name)
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
        process.env[key] = val
      }
    } catch {
      /* missing file */
    }
  }
}

function statementsFromFile(sql) {
  return sql
    .split(';')
    .map((s) =>
      s
        .split('\n')
        .filter((line) => !/^\s*--/.test(line))
        .join('\n')
        .trim()
    )
    .filter(Boolean)
}

async function runFile(neonSql, content, label) {
  const parts = statementsFromFile(content)
  for (const stmt of parts) {
    await neonSql.unsafe(stmt)
  }
  console.log(`Hecho: ${label} (${parts.length} sentencias)`)
}

loadEnv()
const raw = pickDatabaseUrl(process.env)
if (!raw) {
  console.error('Falta DATABASE_URL (o NUXT_DATABASE_URL) en .env')
  process.exit(1)
}

const url = toDirectNeonUrl(raw)
if (url !== raw) {
  console.log('Usando conexión directa Neon (sin -pooler) para DDL.')
}

const sql = neon(url)

const resetPath = join(root, 'database', 'reset_neon.sql')
const schemaPath = join(root, 'database', 'schema.sql')

try {
  await runFile(sql, readFileSync(resetPath, 'utf8'), 'reset_neon.sql')
  await runFile(sql, readFileSync(schemaPath, 'utf8'), 'schema.sql')
  console.log('Esquema Postly aplicado correctamente en Neon.')
} catch (e) {
  console.error('Error ejecutando SQL:', e.message || e)
  process.exit(1)
}
