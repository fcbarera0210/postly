import { requireUserId, requireBoardRole } from '../../utils/requireAuth'
import { dbGetBoard } from '../../utils/postly-db'

export default defineEventHandler(async (event) => {
  const userId = requireUserId(event)
  const boardId = getRouterParam(event, 'boardId')
  if (!boardId) {
    throw createError({ statusCode: 400, statusMessage: 'boardId requerido' })
  }

  const role = await requireBoardRole(boardId, userId, 'editor')
  const board = await dbGetBoard(boardId)
  if (!board) {
    throw createError({ statusCode: 404, statusMessage: 'Tablero no encontrado' })
  }

  return {
    id: board.id,
    name: board.name,
    created_at: board.created_at,
    role
  }
})
