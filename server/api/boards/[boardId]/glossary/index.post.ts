import { nanoid } from 'nanoid'
import { requireUserId, requireBoardRole } from '../../../../utils/requireAuth'
import { dbCreateGlossaryItem, dbGetGlossary } from '../../../../utils/postly-db'

export default defineEventHandler(async (event) => {
  const userId = requireUserId(event)
  const boardId = getRouterParam(event, 'boardId')
  if (!boardId) {
    throw createError({ statusCode: 400, statusMessage: 'boardId requerido' })
  }

  await requireBoardRole(boardId, userId, 'editor')
  const body = await readBody<{ name?: string; color?: string }>(event)
  const name = body.name?.trim()
  const color = body.color?.trim()
  if (!name || !color) {
    throw createError({ statusCode: 400, statusMessage: 'name y color requeridos' })
  }

  const items = await dbGetGlossary(boardId)
  const maxOrder = items.length > 0 ? Math.max(...items.map((i) => i.order)) : -1
  const id = nanoid()
  await dbCreateGlossaryItem(id, boardId, name, color, maxOrder + 1)
  return { id, board_id: boardId, name, color, order: maxOrder + 1 }
})
