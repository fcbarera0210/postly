import { verifyJwt } from './jwt'
import { queryOne } from './neon-query'
import { resolveJwtSecret } from './resolve-jwt-secret'

export function requireUserId(event: import('h3').H3Event): string {
  const secret = resolveJwtSecret()
  if (!secret) {
    throw createError({ statusCode: 500, statusMessage: 'NUXT_SESSION_SECRET no configurado' })
  }
  const auth = getHeader(event, 'authorization')
  if (!auth?.toLowerCase().startsWith('bearer ')) {
    throw createError({ statusCode: 401, statusMessage: 'No autorizado' })
  }
  const token = auth.slice(7).trim()
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'No autorizado' })
  }
  try {
    const { sub } = verifyJwt(token, secret)
    return sub
  } catch {
    throw createError({ statusCode: 401, statusMessage: 'Sesión inválida o expirada' })
  }
}

export type BoardRole = 'owner' | 'editor'

export async function requireBoardRole(
  boardId: string,
  userId: string,
  min: 'editor' | 'owner'
): Promise<BoardRole> {
  const row = await queryOne<{ role: string }>(
    'SELECT role FROM board_members WHERE board_id = $1 AND user_id = $2',
    [boardId, userId]
  )
  if (!row) {
    throw createError({ statusCode: 403, statusMessage: 'Sin acceso a este tablero' })
  }
  const role = row.role as BoardRole
  if (min === 'owner' && role !== 'owner') {
    throw createError({ statusCode: 403, statusMessage: 'Solo el dueño puede hacer esto' })
  }
  return role
}
