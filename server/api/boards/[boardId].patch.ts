import { requireUserId, requireBoardRole } from '../../utils/requireAuth'
import { dbGetBoard, dbUpdateBoardName } from '../../utils/postly-db'

export default defineEventHandler(async (event) => {
  const userId = requireUserId(event)
  const boardId = getRouterParam(event, 'boardId')
  if (!boardId) {
    throw createError({ statusCode: 400, statusMessage: 'boardId requerido' })
  }

  await requireBoardRole(boardId, userId, 'editor')
  const body = await readBody<{ name?: string }>(event)
  const name = body.name?.trim()
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'Nombre requerido' })
  }

  await dbUpdateBoardName(boardId, name)
  const board = await dbGetBoard(boardId)
  return {
    id: board?.id,
    name: board?.name,
    created_at: board?.created_at
  }
})
