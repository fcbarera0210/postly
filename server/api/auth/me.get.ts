import { requireUserId } from '../../utils/requireAuth'
import { dbGetUserById } from '../../utils/postly-db'

export default defineEventHandler(async (event) => {
  const userId = requireUserId(event)
  const user = await dbGetUserById(userId)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Usuario no encontrado' })
  }
  return { id: user.id, email: user.email, display_name: user.display_name ?? null }
})
