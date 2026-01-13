import { neon } from '@neondatabase/serverless'

const config = useRuntimeConfig()

let sql: any = null

export function getDb() {
  if (!sql) {
    const databaseUrl = config.public.databaseUrl || process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error('DATABASE_URL no está configurada')
    }
    // Configurar Neon con supresión de warnings del navegador
    sql = neon(databaseUrl, {
      disableWarningInBrowsers: true
    })
  }
  return sql
}

export async function query<T = any>(queryText: string, params?: any[]): Promise<T[]> {
  const db = getDb()
  try {
    // Intentar usar sql.query() si está disponible
    if (typeof (db as any).query === 'function') {
      if (params && params.length > 0) {
        const result = await (db as any).query(queryText, params)
        return (result?.rows || result || []) as T[]
      } else {
        const result = await (db as any).query(queryText)
        return (result?.rows || result || []) as T[]
      }
    }
    
    // Si no tiene .query(), usar tagged templates
    if (params && params.length > 0) {
      // Construir tagged template manualmente
      const parts: string[] = []
      const values: any[] = []
      let lastIndex = 0
      const regex = /\$(\d+)/g
      let match
      const matches: Array<{ index: number; paramNum: number }> = []
      
      // Encontrar todos los placeholders
      while ((match = regex.exec(queryText)) !== null) {
        const paramNum = parseInt(match[1], 10)
        matches.push({ index: match.index, paramNum })
      }
      
      // Construir partes
      matches.forEach((m, idx) => {
        const start = idx === 0 ? 0 : matches[idx - 1].index + 2
        parts.push(queryText.substring(start, m.index))
        if (m.paramNum <= params.length) {
          values.push(params[m.paramNum - 1])
        }
      })
      // Última parte
      if (matches.length > 0) {
        const lastMatch = matches[matches.length - 1]
        parts.push(queryText.substring(lastMatch.index + 2))
      } else {
        parts.push(queryText)
      }
      
      // Ejecutar como tagged template
      const templateFn = db as any
      const result = await templateFn(parts, ...values)
      return Array.isArray(result) ? result as T[] : []
    } else {
      // Query sin parámetros
      const result = await (db as any)`${queryText}`
      return Array.isArray(result) ? result as T[] : []
    }
  } catch (error) {
    throw error
  }
}

export async function queryOne<T = any>(queryText: string, params?: any[]): Promise<T | null> {
  const results = await query<T>(queryText, params)
  return results.length > 0 ? results[0] : null
}

// Tipos
export interface Board {
  id: string
  name: string
  pin_hash: string
}

export interface Column {
  id: string
  board_id: string
  title: string
  order: number
}

export interface Task {
  id: string
  column_id: string
  title: string
  color: string | null
  order: number
  created_at: number
}

// Funciones CRUD para Board
export async function getBoard(): Promise<Board | null> {
  return queryOne<Board>('SELECT * FROM boards LIMIT 1')
}

export async function createBoard(id: string, name: string, pinHash: string): Promise<Board> {
  await query('INSERT INTO boards (id, name, pin_hash) VALUES ($1, $2, $3)', [id, name, pinHash])
  return { id, name, pin_hash: pinHash }
}

export async function updateBoardName(id: string, name: string): Promise<void> {
  await query('UPDATE boards SET name = $1 WHERE id = $2', [name, id])
}

// Funciones CRUD para Columns
export async function getColumns(boardId: string): Promise<Column[]> {
  return query<Column>('SELECT * FROM columns WHERE board_id = $1 ORDER BY "order" ASC', [boardId])
}

export async function createColumn(id: string, boardId: string, title: string, order: number): Promise<Column> {
  await query('INSERT INTO columns (id, board_id, title, "order") VALUES ($1, $2, $3, $4)', [id, boardId, title, order])
  return { id, board_id: boardId, title, order }
}

export async function updateColumn(id: string, title: string): Promise<void> {
  await query('UPDATE columns SET title = $1 WHERE id = $2', [title, id])
}

export async function deleteColumn(id: string): Promise<void> {
  await query('DELETE FROM columns WHERE id = $1', [id])
}

export async function getColumnCount(boardId: string): Promise<number> {
  const result = await queryOne<{ count: string }>('SELECT COUNT(*) as count FROM columns WHERE board_id = $1', [boardId])
  return result ? parseInt(result.count, 10) : 0
}

export async function reorderColumns(updates: Array<{ id: string; order: number }>): Promise<void> {
  const db = getDb()
  // Usar transacción para actualizar múltiples columnas
  for (const update of updates) {
    await query('UPDATE columns SET "order" = $1 WHERE id = $2', [update.order, update.id])
  }
}

// Funciones CRUD para Tasks
export async function getTasks(columnId: string): Promise<Task[]> {
  return query<Task>('SELECT * FROM tasks WHERE column_id = $1 ORDER BY "order" ASC', [columnId])
}

export async function getTasksByBoard(boardId: string): Promise<Task[]> {
  return query<Task>(
    'SELECT t.* FROM tasks t INNER JOIN columns c ON t.column_id = c.id WHERE c.board_id = $1 ORDER BY c."order" ASC, t."order" ASC',
    [boardId]
  )
}

export async function createTask(id: string, columnId: string, title: string, color: string | null, order: number): Promise<Task> {
  const createdAt = Date.now()
  await query(
    'INSERT INTO tasks (id, column_id, title, color, "order", created_at) VALUES ($1, $2, $3, $4, $5, $6)',
    [id, columnId, title, color, order, createdAt]
  )
  return { id, column_id: columnId, title, color, order, created_at: createdAt }
}

export async function updateTask(id: string, title?: string, color?: string | null): Promise<void> {
  if (title !== undefined) {
    await query('UPDATE tasks SET title = $1 WHERE id = $2', [title, id])
  }
  if (color !== undefined) {
    await query('UPDATE tasks SET color = $1 WHERE id = $2', [color, id])
  }
}

export async function deleteTask(id: string): Promise<void> {
  await query('DELETE FROM tasks WHERE id = $1', [id])
}

export async function moveTask(taskId: string, newColumnId: string, newOrder: number): Promise<void> {
  await query('UPDATE tasks SET column_id = $1, "order" = $2 WHERE id = $3', [newColumnId, newOrder, taskId])
}

export async function reorderTasks(updates: Array<{ id: string; order: number }>): Promise<void> {
  for (const update of updates) {
    await query('UPDATE tasks SET "order" = $1 WHERE id = $2', [update.order, update.id])
  }
}
