import { requireUserId, requireBoardRole } from '../../../../utils/requireAuth'
import { dbDeleteGlossaryItem, dbVerifyGlossaryBelongsToBoard } from '../../../../utils/postly-db'

export default defineEventHandler(async (event) => {
  const userId = requireUserId(event)
  const boardId = getRouterParam(event, 'boardId')
  const itemId = getRouterParam(event, 'itemId')
  if (!boardId || !itemId) {
    throw createError({ statusCode: 400, statusMessage: 'Parámetros inválidos' })
  }

  await requireBoardRole(boardId, userId, 'editor')
  const ok = await dbVerifyGlossaryBelongsToBoard(itemId, boardId)
  if (!ok) {
    throw createError({ statusCode: 404, statusMessage: 'Elemento no encontrado' })
  }

  await dbDeleteGlossaryItem(itemId)
  return { ok: true }
})
