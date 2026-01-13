<template>
  <div
    class="task-card"
    :class="[`task-card--${colorClass}`, { 'is-editing': isEditing }]"
    :style="cardStyle"
    @dblclick.stop="startEdit"
  >
    <div class="task-card__content">
      <input
        v-if="isEditing"
        v-model="editedTitle"
        class="task-card__title-input"
        @blur="handleInputBlur"
        @keyup.enter="handleSave"
        @keyup.esc="cancelEdit"
        @click.stop
        ref="titleInputRef"
      />
      <p v-else class="task-card__title">{{ task.title }}</p>
    </div>
    <div 
      v-if="isEditing" 
      class="task-card__color-picker" 
      @click.stop.prevent
      @mousedown.stop.prevent
      ref="colorPickerRef"
    >
      <button
        v-for="color in availableColors"
        :key="color.value"
        type="button"
        class="task-card__color-option"
        :class="{ 'task-card__color-option--active': selectedColor === color.value }"
        :style="{ backgroundColor: color.bg }"
        @click.stop.prevent="handleColorSelect(color.value)"
        @mousedown.stop.prevent
        :title="color.label"
        :aria-label="`Color ${color.label}`"
      />
      <button
        type="button"
        class="task-card__color-option task-card__color-option--clear"
        :class="{ 'task-card__color-option--active': selectedColor === null }"
        @click.stop.prevent="handleColorSelect(null)"
        @mousedown.stop.prevent
        title="Sin color"
        aria-label="Sin color"
      >
        ×
      </button>
    </div>
    <button
      class="task-card__delete"
      @click.stop="$emit('delete')"
      aria-label="Eliminar tarea"
    >
      ×
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import type { Task } from '~/utils/db'

const props = defineProps<{
  task: Task
}>()

const emit = defineEmits<{
  delete: []
  update: [taskId: string, updates: { title?: string; color?: string | null }]
}>()

const isEditing = ref(false)
const editedTitle = ref('')
const selectedColor = ref<string | null>(null)
const titleInputRef = ref<HTMLInputElement | null>(null)
const colorPickerRef = ref<HTMLDivElement | null>(null)
const isClickingColor = ref(false)

const availableColors = [
  { value: 'yellow', label: 'Amarillo', bg: 'var(--postit-yellow)' },
  { value: 'pink', label: 'Rosa', bg: 'var(--postit-pink)' },
  { value: 'blue', label: 'Azul', bg: 'var(--postit-blue)' },
  { value: 'green', label: 'Verde', bg: 'var(--postit-green)' },
  { value: 'orange', label: 'Naranja', bg: 'var(--postit-orange)' },
  { value: 'purple', label: 'Morado', bg: 'var(--postit-purple)' },
  { value: 'red', label: 'Rojo', bg: 'var(--postit-red)' },
  { value: 'cyan', label: 'Cian', bg: 'var(--postit-cyan)' }
]

function startEdit() {
  editedTitle.value = props.task.title
  selectedColor.value = props.task.color
  isEditing.value = true
  nextTick(() => {
    titleInputRef.value?.focus()
    titleInputRef.value?.select()
  })
}

function handleSave() {
  if (editedTitle.value.trim() && (editedTitle.value !== props.task.title || selectedColor.value !== props.task.color)) {
    emit('update', props.task.id, {
      title: editedTitle.value.trim(),
      color: selectedColor.value
    })
  }
  isEditing.value = false
}

function handleInputBlur(event: FocusEvent) {
  // Esperar un momento para verificar si el blur fue causado por un clic en el color picker
  setTimeout(() => {
    if (!isClickingColor.value) {
      handleSave()
    } else {
      isClickingColor.value = false
      // Re-enfocar el input
      nextTick(() => {
        titleInputRef.value?.focus()
      })
    }
  }, 150)
}

function handleColorSelect(color: string | null) {
  isClickingColor.value = true
  selectedColor.value = color
  // No cerrar el editor, solo actualizar el color
  nextTick(() => {
    isClickingColor.value = false
  })
}

function cancelEdit() {
  editedTitle.value = props.task.title
  selectedColor.value = props.task.color
  isEditing.value = false
}

const colorClass = computed(() => {
  if (!props.task.color) return 'default'
  return props.task.color
})

const cardStyle = computed(() => {
  if (!props.task.color) return {}
  
  const colorMap: Record<string, string> = {
    yellow: 'var(--postit-yellow)',
    pink: 'var(--postit-pink)',
    blue: 'var(--postit-blue)',
    green: 'var(--postit-green)',
    orange: 'var(--postit-orange)',
    purple: 'var(--postit-purple)',
    red: 'var(--postit-red)',
    cyan: 'var(--postit-cyan)',
    default: 'var(--postit-default)'
  }

  const bgColor = colorMap[props.task.color] || colorMap.default
  return {
    backgroundColor: bgColor
  }
})
</script>

<style scoped>
.task-card {
  position: relative;
  background: var(--postit-default);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-postit);
  min-height: 100px;
  cursor: grab;
  transition: transform var(--transition-base), box-shadow var(--transition-base);
  break-inside: avoid;
  touch-action: pan-y;
  user-select: none;
}

.task-card.is-editing {
  cursor: default;
  user-select: text;
}

.task-card:active:not(.is-editing) {
  cursor: grabbing !important;
  transform: rotate(1deg) scale(1.02);
}

.task-card:hover:not(.is-editing) {
  transform: translateY(-3px);
  box-shadow: var(--shadow-postit-hover);
}

/* Estilos para el elemento ghost durante el drag */
.task-card.sortable-ghost {
  opacity: 0.4;
  cursor: grabbing !important;
}

.task-card.sortable-drag {
  cursor: grabbing !important;
  opacity: 0.9;
  transform: rotate(2deg) scale(1.05);
  box-shadow: var(--shadow-xl);
  z-index: 1000;
}

@media (max-width: 768px) {
  .task-card {
    min-height: 80px;
    padding: var(--spacing-sm);
  }
  
  .task-card:active {
    transform: rotate(0.5deg) scale(1.01);
  }
}

.task-card__content {
  flex: 1;
}

.task-card__title {
  font-size: var(--font-size-base);
  line-height: var(--line-height-relaxed);
  color: var(--text-primary);
  word-wrap: break-word;
  margin: 0;
  cursor: text;
  font-weight: var(--font-weight-normal);
}

.task-card__title-input {
  width: 100%;
  font-size: var(--font-size-base);
  line-height: 1.4;
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.3);
  border: 2px solid var(--postit-blue);
  border-radius: var(--border-radius-sm);
  padding: var(--spacing-xs);
  font-family: inherit;
  resize: none;
}

.task-card__color-picker {
  display: flex;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-sm);
  flex-wrap: wrap;
  padding: var(--spacing-xs);
  background: rgba(255, 255, 255, 0.2);
  border-radius: var(--border-radius-sm);
  position: relative;
  z-index: 10;
  pointer-events: auto;
}

.task-card__color-option {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all var(--transition-base);
  flex-shrink: 0;
  position: relative;
  z-index: 11;
  pointer-events: auto;
  -webkit-tap-highlight-color: transparent;
}

.task-card__color-option:hover {
  transform: scale(1.2);
  border-color: var(--text-primary);
  box-shadow: var(--shadow-sm);
}

.task-card__color-option:active {
  transform: scale(1.1);
}

.task-card__color-option--active {
  border-color: var(--text-primary);
  box-shadow: var(--shadow-md);
  transform: scale(1.25);
}

.task-card__color-option--clear {
  background: rgba(255, 255, 255, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  line-height: 1;
  font-weight: bold;
}

.task-card__delete {
  position: absolute;
  top: var(--spacing-xs);
  right: var(--spacing-xs);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  font-size: 24px;
  line-height: 1;
  opacity: 0;
  padding: var(--spacing-xs);
  transition: opacity var(--transition-base), color var(--transition-base), transform var(--transition-base);
  cursor: pointer;
  z-index: 10;
}

.task-card:hover .task-card__delete {
  opacity: 1;
}

.task-card__delete:hover {
  color: #d32f2f;
  transform: scale(1.3);
}

.task-card__delete:active {
  transform: scale(1.1);
}
</style>
