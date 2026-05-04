import { requireUserId, requireBoardRole } from '../../../../utils/requireAuth'
import { dbRemoveMember } from '../../../../utils/postly-db'

export default defineEventHandler(async (event) => {
  const ownerId = requireUserId(event)
  const boardId = getRouterParam(event, 'boardId')
  const targetUserId = getRouterParam(event, 'userId')
  if (!boardId || !targetUserId) {
    throw createError({ statusCode: 400, statusMessage: 'Parámetros inválidos' })
  }

  await requireBoardRole(boardId, ownerId, 'owner')
  if (targetUserId === ownerId) {
    throw createError({ statusCode: 400, statusMessage: 'No puedes eliminarte a ti mismo como dueño' })
  }

  await dbRemoveMember(boardId, targetUserId)
  return { ok: true }
})
