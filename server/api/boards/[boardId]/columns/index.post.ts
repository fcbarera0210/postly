import { nanoid } from 'nanoid'
import { requireUserId, requireBoardRole } from '../../../../utils/requireAuth'
import { dbCreateColumn, dbGetColumns } from '../../../../utils/postly-db'

export default defineEventHandler(async (event) => {
  const userId = requireUserId(event)
  const boardId = getRouterParam(event, 'boardId')
  if (!boardId) {
    throw createError({ statusCode: 400, statusMessage: 'boardId requerido' })
  }

  await requireBoardRole(boardId, userId, 'editor')
  const body = await readBody<{ title?: string }>(event)
  const title = body.title?.trim()
  if (!title || title.length < 3) {
    throw createError({ statusCode: 400, statusMessage: 'Título de columna inválido' })
  }

  const cols = await dbGetColumns(boardId)
  const maxOrder = cols.length > 0 ? Math.max(...cols.map((c) => c.order)) : -1
  const newOrder = maxOrder + 1
  const id = nanoid()
  await dbCreateColumn(id, boardId, title, newOrder)
  return { id, board_id: boardId, title, order: newOrder }
})
