export function resolveJwtSecret(): string {
  const fromProcess = (
    process.env.NUXT_SESSION_SECRET ||
    process.env.JWT_SECRET ||
    ''
  ).trim()
  if (fromProcess) return fromProcess
  try {
    const config = useRuntimeConfig()
    const fromRuntime = ((config.jwtSecret as string) || '').trim()
    if (fromRuntime) return fromRuntime
  } catch {
    /* useRuntimeConfig fuera de contexto Nitro */
  }
  if (process.env.NODE_ENV === 'development') {
    return 'postly-dev-jwt-secret-change-in-production'
  }
  return ''
}
