import { nanoid } from 'nanoid'
import { hashPassword } from '~/utils/security'
import { signJwt } from '../../utils/jwt'
import { resolveJwtSecret } from '../../utils/resolve-jwt-secret'
import { dbCreateUser, dbGetUserByEmail } from '../../utils/postly-db'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string; password?: string }>(event)
  const email = body.email?.trim().toLowerCase()
  const password = body.password

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email || !emailRegex.test(email)) {
    throw createError({ statusCode: 400, statusMessage: 'Email inválido' })
  }
  if (!password || password.length < 6) {
    throw createError({ statusCode: 400, statusMessage: 'La contraseña debe tener al menos 6 caracteres' })
  }

  const existing = await dbGetUserByEmail(email)
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'Este email ya está registrado' })
  }

  const passwordHash = await hashPassword(password)
  const userId = nanoid()
  const user = await dbCreateUser(userId, email, passwordHash)

  const secret = resolveJwtSecret()
  if (!secret) {
    throw createError({ statusCode: 500, statusMessage: 'Servidor sin NUXT_SESSION_SECRET' })
  }
  const token = signJwt(user.id, secret)

  return {
    token,
    user: { id: user.id, email: user.email, display_name: user.display_name ?? null }
  }
})
