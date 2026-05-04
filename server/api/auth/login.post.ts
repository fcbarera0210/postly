import { verifyPassword } from '~/utils/security'
import { signJwt } from '../../utils/jwt'
import { resolveJwtSecret } from '../../utils/resolve-jwt-secret'
import { dbGetUserByEmail } from '../../utils/postly-db'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string; password?: string }>(event)
  const email = body.email?.trim().toLowerCase()
  const password = body.password

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email || !emailRegex.test(email)) {
    throw createError({ statusCode: 400, statusMessage: 'Email inválido' })
  }
  if (!password) {
    throw createError({ statusCode: 400, statusMessage: 'Contraseña requerida' })
  }

  const user = await dbGetUserByEmail(email)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Email o contraseña incorrectos' })
  }

  const ok = await verifyPassword(password, user.password_hash)
  if (!ok) {
    throw createError({ statusCode: 401, statusMessage: 'Email o contraseña incorrectos' })
  }

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
