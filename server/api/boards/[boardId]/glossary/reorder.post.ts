import { requireUserId, requireBoardRole } from '../../../../utils/requireAuth'
import { dbReorderGlossary, dbVerifyGlossaryBelongsToBoard } from '../../../../utils/postly-db'

export default defineEventHandler(async (event) => {
  const userId = requireUserId(event)
  const boardId = getRouterParam(event, 'boardId')
  if (!boardId) {
    throw createError({ statusCode: 400, statusMessage: 'boardId requerido' })
  }

  await requireBoardRole(boardId, userId, 'editor')
  const body = await readBody<{ updates?: Array<{ id: string; order: number }> }>(event)
  const updates = body.updates
  if (!updates?.length) {
    throw createError({ statusCode: 400, statusMessage: 'updates requerido' })
  }

  for (const u of updates) {
    const ok = await dbVerifyGlossaryBelongsToBoard(u.id, boardId)
    if (!ok) {
      throw createError({ statusCode: 400, statusMessage: 'Elemento no pertenece al tablero' })
    }
  }

  await dbReorderGlossary(updates)
  return { ok: true }
})
