/** Convierte timestamps de Postgres/Neon (number o string numérica) a milisegundos Unix. */
export function parseTimestampMs(value: unknown): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const n = parseInt(value, 10)
    if (Number.isFinite(n)) return n
  }
  if (typeof value === 'bigint') return Number(value)
  return null
}

/** Fecha local legible; evita Invalid Date cuando el driver devuelve string. */
export function formatLocaleDateTime(value: unknown, locale = 'es'): string {
  const ms = parseTimestampMs(value)
  if (ms === null) return '—'
  const d = new Date(ms)
  if (Number.isNaN(d.getTime())) return '—'
  try {
    return d.toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return '—'
  }
}
