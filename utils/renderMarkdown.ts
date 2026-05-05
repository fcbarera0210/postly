import { marked } from 'marked'
import DOMPurify from 'isomorphic-dompurify'

marked.setOptions({
  gfm: true,
  breaks: true
})

const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  'b',
  'i',
  'u',
  'ul',
  'ol',
  'li',
  'a',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'code',
  'pre',
  'blockquote',
  'hr'
]

/** Convierte Markdown a HTML seguro para mostrar en la vista previa (sin scripts ni adjuntos). */
export function renderMarkdownToSafeHtml(markdown: string): string {
  const src = markdown.trim()
  if (!src) return ''
  const raw = marked.parse(src, { async: false }) as string
  return DOMPurify.sanitize(raw, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'class'],
    ALLOW_DATA_ATTR: false
  })
}
