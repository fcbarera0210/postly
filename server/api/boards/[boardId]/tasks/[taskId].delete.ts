import { requireUserId, requireBoardRole } from '../../../../utils/requireAuth'
import { dbDeleteTask, dbVerifyTaskBelongsToBoard } from '../../../../utils/postly-db'

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

  await dbDeleteTask(taskId)
  return { ok: true }
})
