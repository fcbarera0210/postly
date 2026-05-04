import { requireUserId } from '../../utils/requireAuth'
import { dbGetUserById, dbUpdateUserDisplayName } from '../../utils/postly-db'

const MAX = 80

export default defineEventHandler(async (event) => {
  const userId = requireUserId(event)
  const body = await readBody<{ display_name?: string | null }>(event)

  const raw = body.display_name
  if (raw === undefined) {
    throw createError({ statusCode: 400, statusMessage: 'Envía display_name (string, null o vacío para borrar)' })
  }

  if (raw === null) {
    await dbUpdateUserDisplayName(userId, null)
  } else if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (trimmed.length === 0) {
      await dbUpdateUserDisplayName(userId, null)
    } else if (trimmed.length > MAX) {
      throw createError({
        statusCode: 400,
        statusMessage: `El nombre visible debe tener como mucho ${MAX} caracteres`
      })
    } else {
      await dbUpdateUserDisplayName(userId, trimmed)
    }
  } else {
    throw createError({ statusCode: 400, statusMessage: 'display_name inválido' })
  }

  const user = await dbGetUserById(userId)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Usuario no encontrado' })
  }

  return { id: user.id, email: user.email, display_name: user.display_name ?? null }
})
