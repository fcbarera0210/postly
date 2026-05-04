import { requireUserId, requireBoardRole } from '../../../../utils/requireAuth'
import { dbMoveTask, dbReorderTasks, dbVerifyColumnBelongsToBoard, dbVerifyTaskBelongsToBoard } from '../../../../utils/postly-db'

export default defineEventHandler(async (event) => {
  const userId = requireUserId(event)
  const boardId = getRouterParam(event, 'boardId')
  if (!boardId) {
    throw createError({ statusCode: 400, statusMessage: 'boardId requerido' })
  }

  await requireBoardRole(boardId, userId, 'editor')
  const body = await readBody<{ taskId?: string; newColumnId?: string; newOrder?: number }>(event)
  const { taskId, newColumnId, newOrder } = body
  if (!taskId || !newColumnId || typeof newOrder !== 'number') {
    throw createError({ statusCode: 400, statusMessage: 'taskId, newColumnId y newOrder requeridos' })
  }

  const taskOk = await dbVerifyTaskBelongsToBoard(taskId, boardId)
  if (!taskOk) {
    throw createError({ statusCode: 404, statusMessage: 'Tarea no encontrada' })
  }
  const colOk = await dbVerifyColumnBelongsToBoard(newColumnId, boardId)
  if (!colOk) {
    throw createError({ statusCode: 400, statusMessage: 'Columna inválida' })
  }

  await dbMoveTask(taskId, newColumnId, newOrder)
  return { ok: true }
})
