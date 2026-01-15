<template>
  <div class="column">
    <div class="column__header">
      <input
        v-if="isEditingTitle"
        v-model="editedTitle"
        class="column__title-input"
        @blur="handleTitleSave"
        @keyup.enter="handleTitleSave"
        @keyup.esc="cancelEdit"
        ref="titleInputRef"
      />
      <h2
        v-else
        class="column__title"
        @dblclick="startEditTitle"
        @touchstart.stop="handleTouchStart"
        @touchend.stop="handleTouchEnd"
        @touchmove.stop="handleTouchMove"
      >
        {{ column.title }}
      </h2>
      <div class="column__actions">
        <button
          v-if="canDelete"
          class="column__delete"
          @click="$emit('delete')"
          aria-label="Eliminar columna"
        >
          ×
        </button>
      </div>
    </div>

    <div class="column__tasks" :class="{ 'column__tasks--empty': localTasks.length === 0 }">
      <draggable
        v-model="localTasks"
        :animation="200"
        :group="{ name: 'tasks', pull: true, put: true }"
        item-key="id"
        :filter="'.is-editing'"
        :prevent-on-filter="true"
        :force-fallback="false"
        :ghost-class="'sortable-ghost'"
        :drag-class="'sortable-drag'"
        @end="handleTaskDragEnd"
        @change="handleTaskChange"
        class="column__tasks-draggable"
        :class="{ 'column__tasks-draggable--empty': localTasks.length === 0 }"
      >
        <template #item="{ element }">
          <TaskCard
            :task="element"
            @delete="() => $emit('task-delete', element.id)"
            @update="handleTaskUpdate"
          />
        </template>
      </draggable>
      <div v-if="localTasks.length === 0" class="column__tasks-empty">
        <p>No hay tareas</p>
      </div>
    </div>

    <button
      class="column__add-task"
      @click="showAddTask = true"
    >
      + Agregar tarea
    </button>

    <div v-if="showAddTask" class="column__add-form">
      <input
        v-model="newTaskTitle"
        class="column__task-input"
        placeholder="Título de la tarea..."
        maxlength="200"
        @keyup.enter="handleAddTask"
        @keyup.esc="cancelAddTask"
        ref="taskInputRef"
      />
      <div v-if="newTaskTitle.length > 0 && newTaskTitle.length < 3" class="column__form-error">
        El título debe tener al menos 3 caracteres
      </div>
      <div class="column__color-picker">
        <button
          v-for="color in availableColors"
          :key="color.value"
          class="column__color-option"
          :class="{ 'column__color-option--active': selectedColor === color.value }"
          :style="{ backgroundColor: color.bg }"
          @click="selectedColor = color.value"
          :aria-label="`Color ${color.label}`"
        />
        <button
          class="column__color-option column__color-option--clear"
          :class="{ 'column__color-option--active': selectedColor === null }"
          @click="selectedColor = null"
          aria-label="Sin color"
        >
          ×
        </button>
      </div>
      <div class="column__form-actions">
        <button
          class="column__form-button column__form-button--primary"
          @click="handleAddTask"
          :disabled="!newTaskTitle.trim() || newTaskTitle.trim().length < 3"
        >
          Agregar
        </button>
        <button
          class="column__form-button"
          @click="cancelAddTask"
        >
          Cancelar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted } from 'vue'
import draggable from 'vuedraggable'
import TaskCard from './TaskCard.vue'
import type { Column, Task } from '~/utils/db'

const props = defineProps<{
  column: Column
  tasks: Task[]
  canDelete: boolean
}>()

const emit = defineEmits<{
  'task-create': [columnId: string, title: string, color: string | null]
  'task-delete': [taskId: string]
  'task-move': [taskId: string, newColumnId: string, newOrder: number]
  'task-reorder': [columnId: string, updates: Array<{ id: string; order: number }>]
  'update-title': [columnId: string, title: string]
  'delete': []
}>()

const isEditingTitle = ref(false)
const editedTitle = ref('')
const titleInputRef = ref<HTMLInputElement | null>(null)
const showAddTask = ref(false)
const newTaskTitle = ref('')
const selectedColor = ref<string | null>(null)
const taskInputRef = ref<HTMLInputElement | null>(null)

// Long press para móvil
let longPressTimer: ReturnType<typeof setTimeout> | null = null
const LONG_PRESS_DURATION = 500 // ms

const localTasks = ref<Task[]>([])

// Watch para sincronizar props.tasks con localTasks
let isDragging = false

watch(() => props.tasks, (newTasks) => {
  // No actualizar durante drag & drop para evitar conflictos
  if (isDragging) {
    return
  }
  
  // Si no hay tareas, limpiar localTasks
  if (!newTasks || !Array.isArray(newTasks)) {
    localTasks.value = []
    return
  }
  
  // Ordenar las tareas por order
  const newTasksSorted = [...newTasks].sort((a, b) => a.order - b.order)
  
  // Comparar si realmente cambió comparando IDs, longitud o propiedades de las tareas
  const newIds = newTasksSorted.map(t => t.id).sort().join(',')
  const currentIds = localTasks.value.map(t => t.id).sort().join(',')
  
  // Comparar también propiedades de las tareas (como color) para detectar cambios
  const newTasksHash = newTasksSorted.map(t => `${t.id}:${t.color || ''}:${t.title}`).sort().join('|')
  const currentTasksHash = localTasks.value.map(t => `${t.id}:${t.color || ''}:${t.title}`).sort().join('|')
  
  // Actualizar si hay cambios en los IDs, cantidad o propiedades
  if (newIds !== currentIds || localTasks.value.length !== newTasksSorted.length || newTasksHash !== currentTasksHash) {
    localTasks.value = newTasksSorted
  }
}, { immediate: true, deep: true })

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

function startEditTitle() {
  editedTitle.value = props.column.title
  isEditingTitle.value = true
  nextTick(() => {
    titleInputRef.value?.focus()
    titleInputRef.value?.select()
  })
}

function handleTitleSave() {
  if (editedTitle.value.trim() && editedTitle.value !== props.column.title) {
    emit('update-title', props.column.id, editedTitle.value.trim())
  }
  isEditingTitle.value = false
}

function cancelEdit() {
  isEditingTitle.value = false
  editedTitle.value = props.column.title
}

// Handlers para long press en móvil
function handleTouchStart(e: TouchEvent) {
  // Solo activar si no está en modo edición
  if (isEditingTitle.value) return
  
  // Prevenir zoom accidental
  e.preventDefault()
  
  longPressTimer = setTimeout(() => {
    startEditTitle()
    longPressTimer = null
  }, LONG_PRESS_DURATION)
}

function handleTouchEnd() {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
}

function handleTouchMove() {
  // Cancelar si el usuario mueve el dedo
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
}

function handleAddTask() {
  if (!newTaskTitle.value.trim()) return
  
  emit('task-create', props.column.id, newTaskTitle.value.trim(), selectedColor.value)
  newTaskTitle.value = ''
  selectedColor.value = null
  showAddTask.value = false
}

function cancelAddTask() {
  newTaskTitle.value = ''
  selectedColor.value = null
  showAddTask.value = false
}

watch(showAddTask, (show) => {
  if (show) {
    nextTick(() => {
      taskInputRef.value?.focus()
    })
  }
})

function handleTaskUpdate(taskId: string, updates: { title?: string; color?: string | null }) {
  emit('task-update', taskId, updates)
}

function handleTaskDragEnd() {
  // Resetear isDragging después de un pequeño delay para permitir que handleTaskChange complete
  setTimeout(() => {
    isDragging = false
  }, 100)
  
  // El orden ya se actualizó en localTasks, sincronizar con BD
  // Solo reordenar si hay tareas en esta columna
  if (localTasks.value.length > 0) {
    const updates = localTasks.value.map((task, index) => ({
      id: task.id,
      order: index
    }))
    emit('task-reorder', props.column.id, updates)
  }
}

function handleTaskChange(event: any) {
  // Marcar que estamos en proceso de drag
  isDragging = true
  
  if (event.added) {
    // Tarea movida desde otra columna a esta
    const task = event.added.element as Task
    const newIndex = event.added.newIndex
    // Emitir evento de movimiento - esto actualizará la BD
    emit('task-move', task.id, props.column.id, newIndex)
    // Resetear isDragging después de un delay para permitir que el movimiento se complete
    setTimeout(() => {
      isDragging = false
    }, 200)
  } else if (event.removed) {
    // Tarea movida desde esta columna a otra
    // El evento task-move se manejará en la columna destino
    // Resetear isDragging después de un delay
    setTimeout(() => {
      isDragging = false
    }, 200)
  } else if (event.moved) {
    // Tarea reordenada dentro de la misma columna
    // handleTaskDragEnd se encargará del reordenamiento
    // No resetear isDragging aquí, lo hará handleTaskDragEnd
  }
}
</script>

<style scoped>
.column {
  display: flex;
  flex-direction: column;
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  min-width: 280px;
  max-width: 320px;
  width: 100%;
  height: fit-content;
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--transition-base);
}

.column:hover {
  box-shadow: var(--shadow-md);
}

@media (max-width: 768px) {
  .column {
    min-width: 260px;
    max-width: 280px;
    padding: var(--spacing-md);
  }
}

.column__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-lg);
  gap: var(--spacing-md);
}

.column__title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
  color: var(--text-primary);
  flex: 1;
  cursor: pointer;
  padding: var(--spacing-xs);
  border-radius: var(--border-radius-sm);
  transition: background-color var(--transition-base), transform var(--transition-fast);
  letter-spacing: -0.01em;
}

.column__title:active {
  transform: scale(0.98);
}

.column__title:hover {
  background: var(--bg-secondary);
}

.column__title-input {
  flex: 1;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
  background: var(--bg-secondary);
  border: 2px solid var(--brand-primary);
  letter-spacing: -0.01em;
}

.column__actions {
  display: flex;
  gap: var(--spacing-xs);
}

.column__delete {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  font-size: 24px;
  line-height: 1;
  transition: color var(--transition-base), transform var(--transition-base);
  padding: var(--spacing-xs);
  cursor: pointer;
}

.column__delete:hover {
  color: #d32f2f;
  transform: scale(1.3);
}

.column__delete:active {
  transform: scale(1.1);
}

.column__tasks {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding-bottom: var(--spacing-md);
  position: relative;
}

.column__tasks--empty {
  min-height: 60px;
}

@media (max-width: 768px) {
  .column__tasks {
    min-height: 60px;
  }
}

.column__add-task {
  margin-top: var(--spacing-lg);
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--bg-secondary);
  border: 1px dashed var(--border-color);
  border-radius: var(--border-radius-md);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  transition: all var(--transition-base);
  font-weight: var(--font-weight-medium);
}

.column__add-task:hover {
  background: var(--bg-primary);
  border-color: var(--brand-primary);
  color: var(--text-primary);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.column__add-task:active {
  transform: translateY(0);
}

.column__add-form {
  margin-top: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background: var(--bg-secondary);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.column__task-input {
  width: 100%;
}

.column__color-picker {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.column__color-option {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform var(--transition-base), border-color var(--transition-base), box-shadow var(--transition-base);
}

.column__color-option:hover {
  transform: scale(1.15);
  box-shadow: var(--shadow-sm);
}

.column__color-option:active {
  transform: scale(1.05);
}

.column__color-option--active {
  border-color: var(--text-primary);
  transform: scale(1.2);
  box-shadow: var(--shadow-md);
}

.column__color-option--clear {
  background: var(--bg-tertiary);
  border: 2px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: var(--text-secondary);
}

.column__form-actions {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-xs);
}

.column__form-button {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  transition: all var(--transition-base);
}

.column__form-button--primary {
  background: var(--brand-primary);
  color: white;
}

.column__form-button--primary:hover:not(:disabled) {
  background: var(--brand-primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.column__form-button--primary:active:not(:disabled) {
  background: var(--brand-primary-active);
  transform: translateY(0);
}

.column__form-button:not(.column__form-button--primary) {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.column__form-button:not(.column__form-button--primary):hover {
  background: var(--bg-primary);
  border-color: var(--text-secondary);
}

.column__form-button:not(.column__form-button--primary):active {
  transform: scale(0.98);
}

.column__tasks-draggable {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  width: 100%;
}

.column__tasks-draggable--empty {
  min-height: 60px;
  position: relative;
}

.column__form-error {
  color: #d32f2f;
  font-size: var(--font-size-sm);
  margin-top: var(--spacing-xs);
}

.column__tasks-empty {
  text-align: center;
  padding: var(--spacing-lg);
  color: var(--text-tertiary);
  font-size: var(--font-size-sm);
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1;
}
</style>
