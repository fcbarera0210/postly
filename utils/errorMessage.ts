/**
 * Mensajes de error legibles para la UI (toasts), sin exponer detalles técnicos.
 * Clasificación por código HTTP: 3xx, 4xx, 5xx y errores de red / desconocidos.
 */

export type HttpErrorKind = 'redirect' | 'client' | 'server' | 'network' | 'unknown'

export function httpStatusKind(status: number | undefined): HttpErrorKind {
  if (status === undefined || Number.isNaN(status)) return 'network'
  if (status >= 300 && status < 400) return 'redirect'
  if (status >= 400 && status < 500) return 'client'
  if (status >= 500 && status < 600) return 'server'
  return 'unknown'
}

/** Extrae status y mensaje del servidor desde errores de $fetch / ofetch / FetchError. */
export function extractFetchErrorParts(e: unknown): { status?: number; serverMsg?: string } {
  if (!e || typeof e !== 'object') return {}
  const o = e as Record<string, unknown>
  const status =
    typeof o.statusCode === 'number'
      ? o.statusCode
      : typeof o.status === 'number'
        ? o.status
        : undefined
  let serverMsg: string | undefined
  if (o.data && typeof o.data === 'object') {
    const d = o.data as Record<string, unknown>
    const sm = d.statusMessage ?? d.message
    if (typeof sm === 'string' && sm.trim()) serverMsg = sm.trim()
  }
  if (!serverMsg && typeof o.statusMessage === 'string' && o.statusMessage.trim()) {
    serverMsg = o.statusMessage.trim()
  }
  return { status, serverMsg }
}

function isProbablyUserFacingSpanish(msg: string): boolean {
  if (msg.length > 280) return false
  if (/stack|trace|ECONNREFUSED|fetch failed|SyntaxError|TypeError/i.test(msg)) return false
  return true
}

function messageForClientStatus(status: number | undefined, serverMsg: string | undefined): string {
  if (status === 401) {
    return 'Correo o contraseña incorrectos, o la sesión expiró.'
  }
  if (status === 403) {
    return serverMsg && isProbablyUserFacingSpanish(serverMsg)
      ? serverMsg
      : 'No tienes permiso para realizar esta acción.'
  }
  if (status === 404) {
    return serverMsg && isProbablyUserFacingSpanish(serverMsg)
      ? serverMsg
      : 'No encontramos lo que buscabas.'
  }
  if (status === 409) {
    return serverMsg && isProbablyUserFacingSpanish(serverMsg)
      ? serverMsg
      : 'Los datos ya cambiaron. Actualiza la página e inténtalo de nuevo.'
  }
  if (status === 422 || status === 400) {
    if (serverMsg && isProbablyUserFacingSpanish(serverMsg)) return serverMsg
    return 'Revisa los datos e inténtalo de nuevo.'
  }
  if (status === 429) {
    return 'Demasiadas solicitudes. Espera un momento e inténtalo de nuevo.'
  }
  if (serverMsg && isProbablyUserFacingSpanish(serverMsg)) return serverMsg
  return 'No se pudo completar la acción.'
}

/**
 * Mensaje único para mostrar en toast u otra UI.
 * No devuelve trazas ni mensajes crudos del servidor en errores 5xx.
 */
export function userFacingErrorMessage(e: unknown, fallback = 'Algo salió mal. Inténtalo de nuevo.'): string {
  const { status, serverMsg } = extractFetchErrorParts(e)
  const kind = httpStatusKind(status)

  if (e instanceof Error && e.message) {
    const local = e.message.trim()
    const noHttp = status === undefined
    if (noHttp && isProbablyUserFacingSpanish(local)) {
      return local
    }
  }

  switch (kind) {
    case 'redirect':
      return 'La solicitud fue redirigida. Vuelve a intentarlo.'
    case 'client':
      return messageForClientStatus(status, serverMsg)
    case 'server':
      return 'El servidor no pudo procesar la solicitud. Inténtalo más tarde.'
    case 'network':
      return 'No hay conexión o el servicio no respondió.'
    default:
      if (serverMsg && isProbablyUserFacingSpanish(serverMsg)) return serverMsg
      if (e instanceof Error && e.message && isProbablyUserFacingSpanish(e.message)) return e.message
      return fallback
  }
}
