/** Nombre visible para UI: display_name si viene informado, si no email. */
export function userLabel(u: { email: string; display_name?: string | null }): string {
  const d = typeof u.display_name === 'string' ? u.display_name.trim() : ''
  return d || u.email
}

/** Iniciales para avatar (máx. 2 caracteres). */
export function userInitials(u: { email: string; display_name?: string | null }): string {
  const label = userLabel(u).trim()
  const parts = label.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    const a = parts[0][0] ?? ''
    const b = parts[1][0] ?? ''
    return (a + b).toUpperCase().slice(0, 2)
  }
  const one = parts[0] ?? label
  if (one.length >= 2) return one.slice(0, 2).toUpperCase()
  return one.slice(0, 1).toUpperCase() || '?'
}
