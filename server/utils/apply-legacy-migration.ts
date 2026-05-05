import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { neon } from '@neondatabase/serverless'

export function parseSqlStatements(sql: string): string[] {
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

function resolveProjectRoot(): string {
  const cwd = process.cwd()
  if (existsSync(join(cwd, 'database', 'schema.sql'))) return cwd
  const fromNuxtCache = join(cwd, 'node_modules', '.cache', 'nuxt')
  if (existsSync(join(fromNuxtCache, '.nuxt'))) {
    let d = cwd
    for (let i = 0; i < 6; i++) {
      const candidate = join(d, 'database', 'schema.sql')
      if (existsSync(candidate)) return d
      const parent = join(d, '..')
      if (parent === d) break
      d = parent
    }
  }
  return cwd
}

/**
 * Ejecuta database/migrate_legacy_to_phase1.sql + backfill user_id → board_members.
 * Usar cliente Neon con URL **directa** (no pooler) para DDL.
 */
export async function applyLegacyMigrationFiles(neonSql: ReturnType<typeof neon>) {
  const root = resolveProjectRoot()
  const migratePath = join(root, 'database', 'migrate_legacy_to_phase1.sql')
  const body = readFileSync(migratePath, 'utf8')
  for (const stmt of parseSqlStatements(body)) {
    await neonSql.unsafe(stmt)
  }

  const col = await neonSql`
    SELECT 1 AS x FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'boards' AND column_name = 'user_id'
    LIMIT 1
  `
  if (Array.isArray(col) && col.length > 0) {
    await neonSql.unsafe(`
      INSERT INTO board_members (board_id, user_id, role)
      SELECT id, user_id, 'owner' FROM boards WHERE user_id IS NOT NULL
      ON CONFLICT (board_id, user_id) DO NOTHING
    `)
  }
}

export async function applyFullSchemaFiles(neonSql: ReturnType<typeof neon>) {
  const root = resolveProjectRoot()
  const resetPath = join(root, 'database', 'reset_neon.sql')
  const schemaPath = join(root, 'database', 'schema.sql')
  const resetBody = readFileSync(resetPath, 'utf8')
  const schemaBody = readFileSync(schemaPath, 'utf8')
  for (const stmt of parseSqlStatements(resetBody)) {
    await neonSql.unsafe(stmt)
  }
  for (const stmt of parseSqlStatements(schemaBody)) {
    await neonSql.unsafe(stmt)
  }
}

export async function verifyPhase1Schema(neonSql: ReturnType<typeof neon>): Promise<boolean> {
  const t = await neonSql`
    SELECT 1 AS x FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'board_members'
    LIMIT 1
  `
  if (!Array.isArray(t) || t.length === 0) return false
  const c = await neonSql`
    SELECT 1 AS x FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'boards' AND column_name = 'created_at'
    LIMIT 1
  `
  return Array.isArray(c) && c.length > 0
}

export async function verifyPhase2Schema(neonSql: ReturnType<typeof neon>): Promise<boolean> {
  const tc = await neonSql`
    SELECT 1 AS x FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'task_comments'
    LIMIT 1
  `
  if (!Array.isArray(tc) || tc.length === 0) return false
  const ta = await neonSql`
    SELECT 1 AS x FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'task_assignees'
    LIMIT 1
  `
  return Array.isArray(ta) && ta.length > 0
}

export async function applyPhase2MigrationFiles(neonSql: ReturnType<typeof neon>) {
  const root = resolveProjectRoot()
  const path = join(root, 'database', 'migrate_phase2.sql')
  const body = readFileSync(path, 'utf8')
  for (const stmt of parseSqlStatements(body)) {
    await neonSql.unsafe(stmt)
  }
}

export async function verifyPhase3Schema(neonSql: ReturnType<typeof neon>): Promise<boolean> {
  const c = await neonSql`
    SELECT 1 AS x FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'display_name'
    LIMIT 1
  `
  return Array.isArray(c) && c.length > 0
}

export async function applyPhase3MigrationFiles(neonSql: ReturnType<typeof neon>) {
  const root = resolveProjectRoot()
  const path = join(root, 'database', 'migrate_phase3.sql')
  const body = readFileSync(path, 'utf8')
  for (const stmt of parseSqlStatements(body)) {
    await neonSql.unsafe(stmt)
  }
}

export async function verifyPhase4Schema(neonSql: ReturnType<typeof neon>): Promise<boolean> {
  const c = await neonSql`
    SELECT 1 AS x FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'description'
    LIMIT 1
  `
  return Array.isArray(c) && c.length > 0
}

export async function applyPhase4MigrationFiles(neonSql: ReturnType<typeof neon>) {
  const root = resolveProjectRoot()
  const path = join(root, 'database', 'migrate_phase4.sql')
  const body = readFileSync(path, 'utf8')
  for (const stmt of parseSqlStatements(body)) {
    await neonSql.unsafe(stmt)
  }
}

export async function verifyPhase5Schema(neonSql: ReturnType<typeof neon>): Promise<boolean> {
  const c = await neonSql`
    SELECT 1 AS x FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'accent_color'
    LIMIT 1
  `
  return Array.isArray(c) && c.length > 0
}

export async function applyPhase5MigrationFiles(neonSql: ReturnType<typeof neon>) {
  const root = resolveProjectRoot()
  const path = join(root, 'database', 'migrate_phase5.sql')
  const body = readFileSync(path, 'utf8')
  for (const stmt of parseSqlStatements(body)) {
    await neonSql.unsafe(stmt)
  }
}
