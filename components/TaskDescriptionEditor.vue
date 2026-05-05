<template>
  <div class="task-desc-editor">
    <div class="task-desc-editor__toolbar" role="toolbar" aria-label="Formato de descripción">
      <button
        type="button"
        class="task-desc-editor__tool"
        title="Negrita (**texto**)"
        aria-label="Negrita"
        @mousedown.prevent
        @click="applyWrap('**', '**')"
      >
        <strong>B</strong>
      </button>
      <button
        type="button"
        class="task-desc-editor__tool"
        title="Cursiva (*texto*)"
        aria-label="Cursiva"
        @mousedown.prevent
        @click="applyWrap('*', '*')"
      >
        <em>I</em>
      </button>
      <button
        type="button"
        class="task-desc-editor__tool"
        title="Lista con viñetas"
        aria-label="Lista con viñetas"
        @mousedown.prevent
        @click="applyLinePrefix('- ')"
      >
        • Lista
      </button>
      <button
        type="button"
        class="task-desc-editor__tool"
        title="Lista numerada"
        aria-label="Lista numerada"
        @mousedown.prevent
        @click="applyLinePrefix('1. ')"
      >
        1.
      </button>
      <button
        type="button"
        class="task-desc-editor__tool task-desc-editor__tool--code"
        title="Código en línea"
        aria-label="Código en línea"
        @mousedown.prevent
        @click="applyWrap('`', '`')"
      >
        code
      </button>
      <button
        type="button"
        class="task-desc-editor__tool"
        title="Cita"
        aria-label="Cita"
        @mousedown.prevent
        @click="applyLinePrefix('> ')"
      >
        Cita
      </button>
      <button
        type="button"
        class="task-desc-editor__tool"
        title="Línea horizontal"
        aria-label="Línea horizontal"
        @mousedown.prevent
        @click="insertHr"
      >
        —
      </button>
      <button
        type="button"
        class="task-desc-editor__tool"
        title="Insertar enlace"
        aria-label="Insertar enlace"
        @mousedown.prevent
        @click="insertLink"
      >
        Enlace
      </button>
      <button
        type="button"
        class="task-desc-editor__tool"
        title="Copiar selección como [texto](url)"
        aria-label="Copiar Markdown del enlace"
        @mousedown.prevent
        @click="copySelectionAsLink"
      >
        Copiar MD
      </button>
    </div>

    <textarea
      ref="textareaRef"
      class="task-desc-editor__textarea board__comment-textarea"
      :value="modelValue"
      maxlength="16000"
      rows="8"
      placeholder="Escribe una descripción en Markdown…"
      aria-label="Descripción de la tarea"
      @input="onInput"
    />

    <p class="task-desc-editor__preview-label">Vista previa</p>
    <div
      v-if="previewHtml"
      class="task-desc-editor__preview markdown-body"
      v-html="previewHtml"
    />
    <p v-else class="task-desc-editor__empty">Sin descripción</p>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { prefixCurrentLine, wrapSelection } from '~/utils/markdownInsert'
import { renderMarkdownToSafeHtml } from '~/utils/renderMarkdown'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const textareaRef = ref<HTMLTextAreaElement | null>(null)

const previewHtml = computed(() => {
  const md = props.modelValue.trim()
  if (!md) return ''
  return renderMarkdownToSafeHtml(md)
})

function onInput(e: Event) {
  const t = e.target as HTMLTextAreaElement
  emit('update:modelValue', t.value)
}

function syncAfterEdit(next: string, selStart: number, selEnd: number) {
  emit('update:modelValue', next)
  nextTick(() => {
    const ta = textareaRef.value
    if (!ta) return
    ta.focus()
    ta.setSelectionRange(selStart, selEnd)
  })
}

function applyWrap(before: string, after: string) {
  const ta = textareaRef.value
  if (!ta) return
  const v = props.modelValue
  const { next, selStart, selEnd } = wrapSelection(v, ta.selectionStart, ta.selectionEnd, before, after)
  syncAfterEdit(next, selStart, selEnd)
}

function applyLinePrefix(prefix: string) {
  const ta = textareaRef.value
  if (!ta) return
  const v = props.modelValue
  const { next, cursor } = prefixCurrentLine(v, ta.selectionStart, prefix)
  syncAfterEdit(next, cursor, cursor)
}

function insertHr() {
  const ta = textareaRef.value
  if (!ta) return
  const v = props.modelValue
  const pos = ta.selectionStart
  const insert = v.length === 0 ? '---\n' : '\n\n---\n'
  const next = v.slice(0, pos) + insert + v.slice(pos)
  const c = pos + insert.length
  syncAfterEdit(next, c, c)
}

function insertLink() {
  const ta = textareaRef.value
  if (!ta || typeof window === 'undefined') return
  const v = props.modelValue
  const start = ta.selectionStart
  const end = ta.selectionEnd
  const selected = v.slice(start, end).trim()
  const url = window.prompt('URL del enlace (https://…)')
  if (url === null || !url.trim()) return
  let label = selected
  if (!label) {
    const t = window.prompt('Texto visible del enlace', 'enlace')
    if (t === null) return
    label = t.trim() || 'enlace'
  }
  const md = `[${label}](${url.trim()})`
  const next = v.slice(0, start) + md + v.slice(end)
  const c = start + md.length
  syncAfterEdit(next, c, c)
}

async function copySelectionAsLink() {
  const ta = textareaRef.value
  if (!ta || typeof window === 'undefined') return
  const v = props.modelValue
  const start = ta.selectionStart
  const end = ta.selectionEnd
  const selected = v.slice(start, end).trim()
  if (!selected) {
    window.alert('Selecciona el texto que será el enlace.')
    return
  }
  const url = window.prompt('URL a incluir en el Markdown copiado')
  if (url === null || !url.trim()) return
  const md = `[${selected}](${url.trim()})`
  try {
    await navigator.clipboard.writeText(md)
  } catch {
    window.alert('No se pudo copiar al portapapeles.')
  }
}
</script>

<style scoped>
.task-desc-editor__toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-sm);
}

.task-desc-editor__tool {
  min-height: 32px;
  padding: 0 var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--border-color);
  background: var(--bg-tertiary);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: background var(--transition-base), border-color var(--transition-base);
}

.task-desc-editor__tool:hover {
  background: var(--bg-primary);
  border-color: var(--text-tertiary);
}

.task-desc-editor__tool--code {
  font-family: ui-monospace, monospace;
  font-size: var(--font-size-xs);
}

.task-desc-editor__textarea {
  width: 100%;
  box-sizing: border-box;
  resize: vertical;
  min-height: 140px;
}

.task-desc-editor__preview-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--text-secondary);
  margin: var(--spacing-md) 0 var(--spacing-xs);
}

.task-desc-editor__preview {
  padding: var(--spacing-sm);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-color);
  background: var(--bg-tertiary);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-relaxed);
  max-height: 280px;
  overflow-y: auto;
}

.task-desc-editor__preview :deep(.markdown-body p) {
  margin: 0 0 0.5em;
}

.task-desc-editor__preview :deep(.markdown-body p:last-child) {
  margin-bottom: 0;
}

.task-desc-editor__preview :deep(.markdown-body ul),
.task-desc-editor__preview :deep(.markdown-body ol) {
  margin: 0.25em 0 0.5em;
  padding-left: 1.25rem;
}

.task-desc-editor__preview :deep(.markdown-body a) {
  color: var(--brand-primary);
  word-break: break-all;
}

.task-desc-editor__preview :deep(.markdown-body code) {
  font-family: ui-monospace, monospace;
  font-size: 0.9em;
  background: rgba(0, 0, 0, 0.06);
  padding: 0.1em 0.35em;
  border-radius: 4px;
}

.task-desc-editor__preview :deep(.markdown-body pre) {
  overflow-x: auto;
  padding: var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  background: rgba(0, 0, 0, 0.06);
}

.task-desc-editor__preview :deep(.markdown-body blockquote) {
  margin: 0.5em 0;
  padding-left: var(--spacing-sm);
  border-left: 3px solid var(--border-color);
  color: var(--text-secondary);
}

.task-desc-editor__empty {
  margin: 0;
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  border: 1px dashed var(--border-color);
  color: var(--text-tertiary);
  font-size: var(--font-size-sm);
  font-style: italic;
  text-align: center;
}
</style>
