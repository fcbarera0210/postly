import { nanoid } from 'nanoid'
import { requireUserId, requireBoardRole } from '../../../../utils/requireAuth'
import {
  dbCreateTask,
  dbGetTasksByBoard,
  dbReorderTasks,
  dbVerifyColumnBelongsToBoard
} from '../../../../utils/postly-db'

export default defineEventHandler(async (event) => {
  const userId = requireUserId(event)
  const boardId = getRouterParam(event, 'boardId')
  if (!boardId) {
    throw createError({ statusCode: 400, statusMessage: 'boardId requerido' })
  }

  await requireBoardRole(boardId, userId, 'editor')
  const body = await readBody<{ columnId?: string; title?: string; color?: string | null }>(event)
  const columnId = body.columnId
  const title = body.title?.trim()
  if (!columnId || !title) {
    throw createError({ statusCode: 400, statusMessage: 'columnId y title requeridos' })
  }

  const colOk = await dbVerifyColumnBelongsToBoard(columnId, boardId)
  if (!colOk) {
    throw createError({ statusCode: 400, statusMessage: 'Columna inválida' })
  }

  const newOrder = 0
  const id = nanoid()
  const createdAt = Date.now()
  await dbCreateTask(id, columnId, title, body.color ?? null, newOrder, createdAt)

  const all = await dbGetTasksByBoard(boardId)
  const columnTasks = all.filter((t) => t.column_id === columnId && t.id !== id)
  if (columnTasks.length > 0) {
    const updates = columnTasks.map((task) => ({
      id: task.id,
      order: task.order + 1
    }))
    await dbReorderTasks(updates)
  }

  return {
    id,
    column_id: columnId,
    title,
    color: body.color ?? null,
    order: newOrder,
    created_at: createdAt
  }
})
