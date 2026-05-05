import { toast } from 'vue-sonner'
import { userFacingErrorMessage } from '~/utils/errorMessage'

export function usePostlyToast() {
  return {
    toast,
    success: (message: string, description?: string) =>
      toast.success(message, description ? { description } : undefined),
    error: (message: string, description?: string) =>
      toast.error(message, description ? { description } : undefined),
    warning: (message: string, description?: string) =>
      toast.warning(message, description ? { description } : undefined),
    /**
     * Error en toast. Si pasas un string, se muestra tal cual; si es un error de red/API, mensaje seguro.
     */
    showError: (e: unknown, fallback?: string) => {
      const msg =
        typeof e === 'string' && e.trim()
          ? e.trim()
          : userFacingErrorMessage(e, fallback ?? 'Algo salió mal. Inténtalo de nuevo.')
      toast.error(msg)
    },
    /**
     * Toast de promesa (cargando → éxito o error). El mensaje de error usa userFacingErrorMessage.
     */
    promiseToast: <T>(
      p: Promise<T>,
      options: {
        loading: string
        success: string | ((data: T) => string)
        errorFallback?: string
      }
    ) =>
      toast.promise(p, {
        loading: options.loading,
        success: options.success,
        error: (e: unknown) =>
          userFacingErrorMessage(e, options.errorFallback ?? 'Algo salió mal. Inténtalo de nuevo.')
      })
  }
}
