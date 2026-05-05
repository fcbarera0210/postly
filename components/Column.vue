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
          type="button"
          class="column__add-header"
          title="Agregar tarea"
          aria-label="Agregar tarea"
          @click="$emit('open-create-task', column.id)"
        >
          +
        </button>
        <button
          v-if="canDelete"
          type="button"
          class="column__delete"
          title="Eliminar columna"
          aria-label="Eliminar columna"
          @click="$emit('delete')"
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
            @open-detail="$emit('task-open-detail', element.id)"
          />
        </template>
      </draggable>
      <div v-if="localTasks.length === 0" class="column__tasks-empty">
        <p>No hay tareas</p>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import draggable from 'vuedraggable'
import TaskCard from './TaskCard.vue'
import type { Column, Task } from '~/utils/types'

const props = defineProps<{
  column: Column
  tasks: Task[]
  canDelete: boolean
}>()

const emit = defineEmits<{
  'open-create-task': [columnId: string]
  'task-delete': [taskId: string]
  'task-open-detail': [taskId: string]
  'task-move': [taskId: string, newColumnId: string, newOrder: number]
  'task-reorder': [columnId: string, updates: Array<{ id: string; order: number }>]
  'update-title': [columnId: string, title: string]
  'delete': []
}>()

const isEditingTitle = ref(false)
const editedTitle = ref('')
const titleInputRef = ref<HTMLInputElement | null>(null)
// Long press para móvil
let longPressTimer: ReturnType<typeof setTimeout> | null = null
const LONG_PRESS_DURATION = 500 // ms

const localTasks = ref<Task[]>([])

/** Firma estable por columna: orden, column_id, responsables, etc. (evita que el Kanban quede desactualizado). */
function columnTasksSnapshot(list: Task[]): string {
  return list
    .map((t) => {
      const assigneeIds = (t.assignees ?? [])
        .map((a) => a.user_id)
        .sort()
        .join(',')
      return `${t.id}:${t.column_id}:${t.order}:${t.color ?? ''}:${t.title}:${assigneeIds}`
    })
    .join('>')
}

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
  
  const newTasksSorted = [...newTasks].sort((a, b) => a.order - b.order)
  const nextSnap = columnTasksSnapshot(newTasksSorted)
  const curSnap = columnTasksSnapshot(localTasks.value)

  if (nextSnap !== curSnap) {
    localTasks.value = newTasksSorted
  }
}, { immediate: true, deep: true })

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
  align-items: center;
  gap: var(--spacing-xs);
  flex-shrink: 0;
}

.column__add-header,
.column__delete {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: var(--spacing-xs);
  border: none;
  background: transparent;
  line-height: 1;
  cursor: pointer;
}

.column__add-header {
  color: var(--text-tertiary);
  font-size: 22px;
  font-weight: var(--font-weight-medium);
  transition:
    color var(--transition-base),
    transform var(--transition-base);
}

.column__add-header:hover {
  color: var(--brand-primary);
  transform: scale(1.15);
}

.column__add-header:active {
  transform: scale(1.05);
}

.column__delete {
  color: var(--text-tertiary);
  font-size: 24px;
  transition: color var(--transition-base), transform var(--transition-base);
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
