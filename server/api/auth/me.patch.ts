import { isUserAccentColorKey } from '~/utils/postitColors'
import { requireUserId } from '../../utils/requireAuth'
import {
  dbGetUserById,
  dbUpdateUserAccentColor,
  dbUpdateUserDisplayName,
  userRowToPublic
} from '../../utils/postly-db'

const MAX = 80

export default defineEventHandler(async (event) => {
  const userId = requireUserId(event)
  const body = await readBody<{ display_name?: string | null; accent_color?: string | null }>(event)

  let updated = false

  if (body.display_name !== undefined) {
    const raw = body.display_name
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
    updated = true
  }

  if (body.accent_color !== undefined) {
    const ac = body.accent_color
    if (ac !== null && !isUserAccentColorKey(ac)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'accent_color debe ser null o una clave de post-it válida (yellow, pink, …)'
      })
    }
    await dbUpdateUserAccentColor(userId, ac)
    updated = true
  }

  if (!updated) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Envía al menos display_name o accent_color para actualizar'
    })
  }

  const user = await dbGetUserById(userId)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Usuario no encontrado' })
  }

  return userRowToPublic(user)
})
