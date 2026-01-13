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
  padding: var(--spacing-md);
  min-width: 280px;
  max-width: 320px;
  width: 100%;
  height: fit-content;
  max-height: calc(100vh - 120px);
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .column {
    min-width: 260px;
    max-width: 280px;
    padding: var(--spacing-sm);
    max-height: calc(100vh - 100px);
  }
}

.column__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
  gap: var(--spacing-sm);
}

.column__title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-primary);
  flex: 1;
  cursor: pointer;
  padding: var(--spacing-xs);
  border-radius: var(--border-radius-sm);
  transition: background-color var(--transition-fast);
}

.column__title:hover {
  background: var(--bg-secondary);
}

.column__title-input {
  flex: 1;
  font-size: var(--font-size-lg);
  font-weight: 600;
  background: var(--bg-secondary);
  border: 2px solid var(--postit-blue);
}

.column__actions {
  display: flex;
  gap: var(--spacing-xs);
}

.column__delete {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(239, 154, 154, 0.2);
  color: #d32f2f;
  font-size: 20px;
  line-height: 1;
  transition: background-color var(--transition-fast);
}

.column__delete:hover {
  background: rgba(239, 154, 154, 0.4);
}

.column__tasks {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  min-height: 0;
  max-height: calc(100vh - 300px);
  padding-bottom: var(--spacing-sm);
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  position: relative;
}

.column__tasks--empty {
  overflow: hidden;
}

@media (max-width: 768px) {
  .column__tasks {
    max-height: calc(100vh - 250px);
    min-height: 0;
  }
}

.column__add-task {
  margin-top: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-secondary);
  border: 1px dashed var(--border-color);
  border-radius: var(--border-radius-md);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  transition: all var(--transition-fast);
}

.column__add-task:hover {
  background: var(--bg-primary);
  border-color: var(--postit-blue);
  color: var(--text-primary);
}

.column__add-form {
  margin-top: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--bg-secondary);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-color);
  animation: slideDown 0.2s ease;
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
  transition: transform var(--transition-fast), border-color var(--transition-fast);
}

.column__color-option:hover {
  transform: scale(1.1);
}

.column__color-option--active {
  border-color: var(--text-primary);
  transform: scale(1.15);
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
  font-weight: 500;
  transition: all var(--transition-fast);
}

.column__form-button--primary {
  background: var(--postit-blue);
  color: white;
}

.column__form-button--primary:hover:not(:disabled) {
  opacity: 0.9;
}

.column__form-button:not(.column__form-button--primary) {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.column__form-button:not(.column__form-button--primary):hover {
  background: var(--bg-primary);
}

.column__tasks-draggable {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  min-height: 0;
  width: 100%;
  flex: 1;
}

.column__tasks-draggable--empty {
  min-height: 60px;
  position: relative;
  flex: 0 0 auto;
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
