/** Opciones de color de post-it para tareas (variables CSS del tema). */
export const POSTIT_COLOR_OPTIONS = [
  { value: 'yellow', label: 'Amarillo', bg: 'var(--postit-yellow)' },
  { value: 'pink', label: 'Rosa', bg: 'var(--postit-pink)' },
  { value: 'blue', label: 'Azul', bg: 'var(--postit-blue)' },
  { value: 'green', label: 'Verde', bg: 'var(--postit-green)' },
  { value: 'orange', label: 'Naranja', bg: 'var(--postit-orange)' },
  { value: 'purple', label: 'Morado', bg: 'var(--postit-purple)' },
  { value: 'red', label: 'Rojo', bg: 'var(--postit-red)' },
  { value: 'cyan', label: 'Cian', bg: 'var(--postit-cyan)' }
] as const

const DEFAULT_BG = 'var(--postit-default)'

export function postitBackgroundCss(color: string | null): string {
  if (!color) return DEFAULT_BG
  const row = POSTIT_COLOR_OPTIONS.find((c) => c.value === color)
  return row?.bg ?? DEFAULT_BG
}
