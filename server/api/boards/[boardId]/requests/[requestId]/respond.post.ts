import { requireUserId, requireBoardRole } from '../../../../../utils/requireAuth'
import { dbAcceptRequest, dbGetMemberRole, dbGetPendingRequest, dbRejectRequest } from '../../../../../utils/postly-db'

export default defineEventHandler(async (event) => {
  const ownerId = requireUserId(event)
  const boardId = getRouterParam(event, 'boardId')
  const requestId = getRouterParam(event, 'requestId')
  if (!boardId || !requestId) {
    throw createError({ statusCode: 400, statusMessage: 'Parámetros inválidos' })
  }

  await requireBoardRole(boardId, ownerId, 'owner')

  const body = await readBody<{ action?: string }>(event)
  const action = body.action
  if (action !== 'accept' && action !== 'reject') {
    throw createError({ statusCode: 400, statusMessage: 'action debe ser accept o reject' })
  }

  const req = await dbGetPendingRequest(requestId, boardId)
  if (!req) {
    throw createError({ statusCode: 404, statusMessage: 'Solicitud no encontrada' })
  }

  if (action === 'reject') {
    await dbRejectRequest(boardId, requestId, ownerId)
    return { ok: true }
  }

  const already = await dbGetMemberRole(boardId, req.requester_id)
  if (already) {
    throw createError({ statusCode: 409, statusMessage: 'El usuario ya es miembro' })
  }

  await dbAcceptRequest(boardId, requestId, req.requester_id, ownerId)
  return { ok: true }
})
