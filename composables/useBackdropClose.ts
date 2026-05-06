import { ref } from 'vue'

/**
 * Cierre de modales solo cuando el clic empieza Y termina sobre el backdrop.
 *
 * Evita el cierre accidental cuando el usuario selecciona texto dentro del modal
 * y suelta el botón fuera: en ese caso el evento `click` se dispararía sobre el
 * ancestro común (el backdrop) cumpliendo `event.target === currentTarget`.
 *
 * Usar `mousedown` para registrar el origen y `mouseup` para confirmar el cierre.
 */
export function useBackdropClose(close: () => void) {
  const pressedOnBackdrop = ref(false)

  const onBackdropMouseDown = (e: MouseEvent) => {
    pressedOnBackdrop.value = e.target === e.currentTarget
  }

  const onBackdropMouseUp = (e: MouseEvent) => {
    if (e.target === e.currentTarget && pressedOnBackdrop.value) {
      close()
    }
    pressedOnBackdrop.value = false
  }

  return { onBackdropMouseDown, onBackdropMouseUp }
}
