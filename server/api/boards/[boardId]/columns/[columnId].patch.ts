import { requireUserId, requireBoardRole } from '../../../../utils/requireAuth'
import { dbUpdateColumn, dbVerifyColumnBelongsToBoard } from '../../../../utils/postly-db'

export default defineEventHandler(async (event) => {
  const userId = requireUserId(event)
  const boardId = getRouterParam(event, 'boardId')
  const columnId = getRouterParam(event, 'columnId')
  if (!boardId || !columnId) {
    throw createError({ statusCode: 400, statusMessage: 'Parámetros inválidos' })
  }

  await requireBoardRole(boardId, userId, 'editor')
  const ok = await dbVerifyColumnBelongsToBoard(columnId, boardId)
  if (!ok) {
    throw createError({ statusCode: 404, statusMessage: 'Columna no encontrada' })
  }

  const body = await readBody<{ title?: string }>(event)
  const title = body.title?.trim()
  if (!title || title.length < 3) {
    throw createError({ statusCode: 400, statusMessage: 'Título inválido' })
  }

  await dbUpdateColumn(columnId, title)
  return { ok: true }
})
