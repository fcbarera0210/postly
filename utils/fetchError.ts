/** Extrae mensaje legible de errores de $fetch / ofetch. */
export function getFetchErrorMessage(e: unknown, fallback: string): string {
  if (e && typeof e === 'object' && 'data' in e) {
    const d = (e as { data?: { statusMessage?: string; message?: string } }).data
    const msg = d?.statusMessage || d?.message
    if (typeof msg === 'string' && msg) return msg
  }
  if (e && typeof e === 'object' && 'statusMessage' in e) {
    const s = (e as { statusMessage?: string }).statusMessage
    if (typeof s === 'string' && s) return s
  }
  if (e instanceof Error && e.message) return e.message
  return fallback
}
