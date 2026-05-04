import { requireUserId } from '../../utils/requireAuth'
import { dbCreateBoardWithColumns } from '../../utils/postly-db'

export default defineEventHandler(async (event) => {
  const userId = requireUserId(event)
  const body = await readBody<{ name?: string; initialColumnTitles?: string[] }>(event)
  const name = body.name?.trim()
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'Nombre requerido' })
  }

  const board = await dbCreateBoardWithColumns(userId, name, body.initialColumnTitles)
  return {
    id: board.id,
    name: board.name,
    created_at: board.created_at,
    role: 'owner'
  }
})
