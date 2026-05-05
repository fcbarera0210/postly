/** Inserta Markdown envolviendo la selección del textarea. */
export function wrapSelection(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  before: string,
  after: string
): { next: string; selStart: number; selEnd: number } {
  const inner = value.slice(selectionStart, selectionEnd)
  const next = value.slice(0, selectionStart) + before + inner + after + value.slice(selectionEnd)
  const start = selectionStart + before.length
  const end = start + inner.length
  return { next, selStart: start, selEnd: end }
}

/** Antepone texto al inicio de la línea donde está el cursor. */
export function prefixCurrentLine(
  value: string,
  cursorPos: number,
  prefix: string
): { next: string; cursor: number } {
  const lineStart = value.lastIndexOf('\n', cursorPos - 1) + 1
  const lineEndIdx = value.indexOf('\n', cursorPos)
  const lineEnd = lineEndIdx === -1 ? value.length : lineEndIdx
  const line = value.slice(lineStart, lineEnd)
  const nextLine = prefix + line
  const next = value.slice(0, lineStart) + nextLine + value.slice(lineEnd)
  return { next, cursor: lineStart + nextLine.length }
}
