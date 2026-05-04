import { requireUserId, requireBoardRole } from '../../../../../../utils/requireAuth'
import { dbDeleteTaskCommentIfOwn, dbVerifyTaskBelongsToBoard } from '../../../../../../utils/postly-db'

export default defineEventHandler(async (event) => {
  const userId = requireUserId(event)
  const boardId = getRouterParam(event, 'boardId')
  const taskId = getRouterParam(event, 'taskId')
  const commentId = getRouterParam(event, 'commentId')
  if (!boardId || !taskId || !commentId) {
    throw createError({ statusCode: 400, statusMessage: 'Parámetros inválidos' })
  }

  await requireBoardRole(boardId, userId, 'editor')
  const ok = await dbVerifyTaskBelongsToBoard(taskId, boardId)
  if (!ok) {
    throw createError({ statusCode: 404, statusMessage: 'Tarea no encontrada' })
  }

  const deleted = await dbDeleteTaskCommentIfOwn(commentId, taskId, userId)
  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: 'Comentario no encontrado o no autorizado' })
  }
  return { ok: true }
})
