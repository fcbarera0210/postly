import { requireUserId, requireBoardRole } from '../../../../../../utils/requireAuth'
import { dbDeleteTaskAssignee, dbVerifyTaskBelongsToBoard } from '../../../../../../utils/postly-db'

export default defineEventHandler(async (event) => {
  const editorId = requireUserId(event)
  const boardId = getRouterParam(event, 'boardId')
  const taskId = getRouterParam(event, 'taskId')
  const assigneeUserId = getRouterParam(event, 'userId')
  if (!boardId || !taskId || !assigneeUserId) {
    throw createError({ statusCode: 400, statusMessage: 'Parámetros inválidos' })
  }

  await requireBoardRole(boardId, editorId, 'editor')
  const ok = await dbVerifyTaskBelongsToBoard(taskId, boardId)
  if (!ok) {
    throw createError({ statusCode: 404, statusMessage: 'Tarea no encontrada' })
  }

  await dbDeleteTaskAssignee(taskId, assigneeUserId)
  return { ok: true }
})
