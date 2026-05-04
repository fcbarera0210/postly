import { requireUserId } from '../../utils/requireAuth'
import { dbBoardExists, dbGetMemberRole, dbUpsertJoinRequest } from '../../utils/postly-db'

export default defineEventHandler(async (event) => {
  const userId = requireUserId(event)
  const body = await readBody<{ boardId?: string }>(event)
  const boardId = body.boardId?.trim()
  if (!boardId) {
    throw createError({ statusCode: 400, statusMessage: 'ID de tablero requerido' })
  }

  const exists = await dbBoardExists(boardId)
  if (!exists) {
    throw createError({ statusCode: 404, statusMessage: 'Tablero no encontrado' })
  }

  const role = await dbGetMemberRole(boardId, userId)
  if (role) {
    throw createError({ statusCode: 409, statusMessage: 'Ya eres miembro de este tablero' })
  }

  await dbUpsertJoinRequest(boardId, userId)
  return { ok: true }
})
