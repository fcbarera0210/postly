import { requireUserId, requireBoardRole } from '../../../../utils/requireAuth'
import { dbListPendingRequests, dbListRecentRequestResolutions } from '../../../../utils/postly-db'

export default defineEventHandler(async (event) => {
  const userId = requireUserId(event)
  const boardId = getRouterParam(event, 'boardId')
  if (!boardId) {
    throw createError({ statusCode: 400, statusMessage: 'boardId requerido' })
  }

  await requireBoardRole(boardId, userId, 'owner')
  const pending = await dbListPendingRequests(boardId)
  const history = await dbListRecentRequestResolutions(boardId, 8)
  return { pending, history }
})
