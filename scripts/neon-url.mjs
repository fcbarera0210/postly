/** URL sin pooler (DDL fiable en Neon). */
export function toDirectNeonUrl(url) {
  if (!url || typeof url !== 'string' || !url.includes('-pooler.')) return url
  try {
    const u = new URL(url)
    u.hostname = u.hostname.replace('-pooler.', '.')
    return u.toString()
  } catch {
    return url
  }
}

export function pickDatabaseUrl(env) {
  return (
    env.NUXT_DATABASE_URL ||
    env.DATABASE_URL ||
    env.DATABASE_URL_UNPOOLED ||
    ''
  ).trim()
}
