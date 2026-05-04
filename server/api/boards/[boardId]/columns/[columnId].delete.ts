import { requireUserId, requireBoardRole } from '../../../../utils/requireAuth'
import {
  dbDeleteColumn,
  dbGetColumnCount,
  dbVerifyColumnBelongsToBoard
} from '../../../../utils/postly-db'

const MIN_COLUMNS = 3

export default defineEventHandler(async (event) => {
  const userId = requireUserId(event)
  const boardId = getRouterParam(event, 'boardId')
  const columnId = getRouterParam(event, 'columnId')
  if (!boardId || !columnId) {
    throw createError({ statusCode: 400, statusMessage: 'Parámetros inválidos' })
  }

  await requireBoardRole(boardId, userId, 'editor')
  const count = await dbGetColumnCount(boardId)
  if (count <= MIN_COLUMNS) {
    throw createError({
      statusCode: 400,
      statusMessage: `Debe haber al menos ${MIN_COLUMNS} columnas`
    })
  }

  const ok = await dbVerifyColumnBelongsToBoard(columnId, boardId)
  if (!ok) {
    throw createError({ statusCode: 404, statusMessage: 'Columna no encontrada' })
  }

  await dbDeleteColumn(columnId)
  return { ok: true }
})
