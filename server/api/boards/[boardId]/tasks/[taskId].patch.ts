import { requireUserId, requireBoardRole } from '../../../../utils/requireAuth'
import { dbUpdateTask, dbVerifyTaskBelongsToBoard } from '../../../../utils/postly-db'

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

  const body = await readBody<{ title?: string; color?: string | null }>(event)
  await dbUpdateTask(taskId, body.title, body.color)
  return { ok: true }
})
