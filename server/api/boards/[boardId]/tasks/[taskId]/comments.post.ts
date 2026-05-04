import { nanoid } from 'nanoid'
import { requireUserId, requireBoardRole } from '../../../../../utils/requireAuth'
import { dbInsertTaskComment, dbVerifyTaskBelongsToBoard } from '../../../../../utils/postly-db'

const MIN_LEN = 1
const MAX_LEN = 8000

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

  const body = await readBody<{ body?: string }>(event)
  const text = typeof body?.body === 'string' ? body.body.trim() : ''
  if (text.length < MIN_LEN || text.length > MAX_LEN) {
    throw createError({
      statusCode: 400,
      statusMessage: `El comentario debe tener entre ${MIN_LEN} y ${MAX_LEN} caracteres`
    })
  }

  const id = nanoid()
  const createdAt = Date.now()
  await dbInsertTaskComment(id, taskId, userId, text, createdAt)
  return { id, task_id: taskId, author_id: userId, body: text, created_at: createdAt }
})
