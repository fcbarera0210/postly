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

/** Fecha local dd/mm/yy (p. ej. “Creada” en el modal de detalle). */
export function formatDateDMYShort(value: unknown): string {
  const ms = parseTimestampMs(value)
  if (ms === null) return '—'
  const d = new Date(ms)
  if (Number.isNaN(d.getTime())) return '—'
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yy = String(d.getFullYear()).slice(-2)
  return `${dd}/${mm}/${yy}`
}

/** dd/mm/yy y hora local HH:mm a la derecha (misma línea que “Creada”). */
export function formatDateDMYShortWithTime(value: unknown): string {
  const ms = parseTimestampMs(value)
  if (ms === null) return '—'
  const d = new Date(ms)
  if (Number.isNaN(d.getTime())) return '—'
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yy = String(d.getFullYear()).slice(-2)
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yy}, ${hh}:${min}`
}
