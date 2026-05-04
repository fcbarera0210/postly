import { requireUserId, requireBoardRole } from '../../../../../utils/requireAuth'
import {
  dbInsertTaskAssignee,
  dbIsBoardMember,
  dbVerifyTaskBelongsToBoard
} from '../../../../../utils/postly-db'

export default defineEventHandler(async (event) => {
  const userId = requireUserId(event)
  const boardId = getRouterParam(event, 'boardId')
  const taskId = getRouterParam(event, 'taskId')
  if (!boardId || !taskId) {
    throw createError({ statusCode: 400, statusMessage: 'Parámetros inválidos' })
  }

  await requireBoardRole(boardId, userId, 'editor')
  const ok = await dbVerifyTaskBelongsToBoard(taskId, boardId)
  if (!ok) {
    throw createError({ statusCode: 404, statusMessage: 'Tarea no encontrada' })
  }

  const body = await readBody<{ user_id?: string }>(event)
  const assigneeUserId = typeof body?.user_id === 'string' ? body.user_id.trim() : ''
  if (!assigneeUserId) {
    throw createError({ statusCode: 400, statusMessage: 'user_id requerido' })
  }

  const member = await dbIsBoardMember(boardId, assigneeUserId)
  if (!member) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Solo se pueden asignar miembros del tablero'
    })
  }

  await dbInsertTaskAssignee(taskId, assigneeUserId)
  return { ok: true }
})
