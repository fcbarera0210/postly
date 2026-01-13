<template>
  <div class="board">
    <div class="board__header">
      <input
        v-if="isEditingName"
        v-model="editedName"
        class="board__name-input"
        @blur="handleNameSave"
        @keyup.enter="handleNameSave"
        @keyup.esc="cancelEdit"
        ref="nameInputRef"
      />
      <h1
        v-else
        class="board__name"
        @dblclick="startEditName"
      >
        {{ board?.name || 'Mi Tablero' }}
      </h1>
      <button
        class="board__add-column"
        @click="showAddColumn = true"
      >
        + Columna
      </button>
    </div>

    <div class="board__columns-wrapper">
      <div v-if="loading" class="board__loading">
        <p>Cargando columnas...</p>
      </div>
      <div v-else-if="localColumns.length > 0" class="board__columns">
        <Column
          v-for="column in localColumns"
          :key="column.id"
          :column="column"
          :tasks="tasksByColumn[column.id] || []"
          :can-delete="columnsCanDelete"
          @task-create="handleTaskCreate"
          @task-delete="handleTaskDelete"
          @task-update="handleTaskUpdate"
          @task-move="handleTaskMove"
          @task-reorder="handleTaskReorder"
          @update-title="handleColumnUpdate"
          @delete="() => handleColumnDelete(column.id)"
        />
      </div>
      <div v-else class="board__empty">
        <p>No hay columnas. Crea una para comenzar.</p>
      </div>
    </div>

    <div v-if="showAddColumn" class="board__add-column-modal" @click.self="cancelAddColumn">
      <div class="board__add-column-form">
        <h3 class="board__form-title">Nueva Columna</h3>
        <input
          v-model="newColumnTitle"
          class="board__column-input"
          placeholder="Nombre de la columna..."
          maxlength="50"
          @keyup.enter="handleAddColumn"
          @keyup.esc="cancelAddColumn"
          ref="columnInputRef"
        />
        <div v-if="newColumnTitle.length > 0 && newColumnTitle.length < 3" class="board__form-error">
          El nombre debe tener al menos 3 caracteres
        </div>
        <div class="board__form-actions">
          <button
            class="board__form-button board__form-button--primary"
            @click="handleAddColumn"
            :disabled="!newColumnTitle.trim() || newColumnTitle.trim().length < 3"
          >
            Agregar
          </button>
          <button
            class="board__form-button"
            @click="cancelAddColumn"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import Column from './Column.vue'
import { useBoard } from '~/composables/useBoard'
import { useColumns } from '~/composables/useColumns'
import { useTasks } from '~/composables/useTasks'
import type { Column as ColumnType, Task } from '~/utils/db'

const { board, loadBoard, updateName } = useBoard()
const boardId = computed(() => board.value?.id || null)
const { columns, loading: columnsLoading, canDelete: columnsCanDelete, loadColumns, create: createColumn, remove: removeColumn, update: updateColumn, reorder: reorderColumns } = useColumns(boardId)
const loading = computed(() => columnsLoading.value)
const { tasks, loadTasks, create: createTask, remove: removeTask, update: updateTask, move: moveTask, reorder: reorderTasks } = useTasks(boardId)

const isEditingName = ref(false)
const editedName = ref('')
const nameInputRef = ref<HTMLInputElement | null>(null)
const showAddColumn = ref(false)
const newColumnTitle = ref('')
const columnInputRef = ref<HTMLInputElement | null>(null)

const localColumns = ref<ColumnType[]>([])

// Computed para mapear tareas por columna de forma reactiva (usando objeto para reactividad)
const tasksByColumn = computed(() => {
  const tasksArray = tasks.value
  const obj: Record<string, Task[]> = {}
  
  // Inicializar todas las columnas con array vacío primero
  localColumns.value.forEach(column => {
    obj[column.id] = []
  })
  
  // Luego asignar las tareas
  localColumns.value.forEach(column => {
    const columnTasks = tasksArray.filter(t => t.column_id === column.id).sort((a, b) => a.order - b.order)
    obj[column.id] = columnTasks
  })
  
  return obj
})

// Watch para sincronizar columns con localColumns
watch(() => columns.value, (newColumns) => {
  if (newColumns && newColumns.length > 0) {
    localColumns.value = [...newColumns]
  } else {
    localColumns.value = []
  }
}, { immediate: true, deep: true })

onMounted(async () => {
  await loadBoard()
  if (board.value) {
    await loadColumns()
    await loadTasks()
    // Asegurar que localColumns se actualice después de cargar
    if (columns.value.length > 0 && localColumns.value.length === 0) {
      localColumns.value = [...columns.value]
    }
  }
})

watch(boardId, async (newBoardId) => {
  if (newBoardId) {
    await loadColumns()
    await loadTasks()
  }
})


function startEditName() {
  editedName.value = board.value?.name || ''
  isEditingName.value = true
  nextTick(() => {
    nameInputRef.value?.focus()
    nameInputRef.value?.select()
  })
}

function handleNameSave() {
  if (editedName.value.trim() && editedName.value !== board.value?.name) {
    updateName(editedName.value.trim())
  }
  isEditingName.value = false
}

function cancelEdit() {
  isEditingName.value = false
  editedName.value = board.value?.name || ''
}

async function handleAddColumn() {
  if (!newColumnTitle.value.trim()) return
  
  try {
    await createColumn(newColumnTitle.value.trim())
    // Recargar columnas para asegurar sincronización
    await loadColumns()
    newColumnTitle.value = ''
    showAddColumn.value = false
  } catch (err) {
    alert('Error al crear la columna. Por favor, intenta nuevamente.')
  }
}

function cancelAddColumn() {
  newColumnTitle.value = ''
  showAddColumn.value = false
}

watch(showAddColumn, (show) => {
  if (show) {
    nextTick(() => {
      columnInputRef.value?.focus()
    })
  }
})

async function handleColumnDelete(columnId: string) {
  try {
    await removeColumn(columnId)
    // Recargar columnas para asegurar sincronización
    await loadColumns()
  } catch (err) {
    alert(err instanceof Error ? err.message : 'Error al eliminar la columna')
  }
}

async function handleColumnUpdate(columnId: string, title: string) {
  if (!title.trim() || title.trim().length < 3) {
    alert('El nombre de la columna debe tener al menos 3 caracteres')
    return
  }
  try {
    await updateColumn(columnId, title)
    // Recargar columnas para sincronizar
    await loadColumns()
  } catch (err) {
    alert('Error al actualizar la columna. Por favor, intenta nuevamente.')
  }
}


async function handleTaskCreate(columnId: string, title: string, color: string | null) {
  try {
    await createTask(columnId, title, color)
    // Recargar tareas para sincronizar - esto actualizará tasks.value y el watch en Column actualizará localTasks
    await loadTasks()
    // Forzar actualización reactiva
    await nextTick()
  } catch (err) {
    alert('Error al crear la tarea. Por favor, intenta nuevamente.')
  }
}

async function handleTaskUpdate(taskId: string, updates: { title?: string; color?: string | null }) {
  try {
    // Actualizar localmente primero para reactividad inmediata
    const task = tasks.value.find(t => t.id === taskId)
    if (task) {
      if (updates.title !== undefined) task.title = updates.title
      if (updates.color !== undefined) task.color = updates.color
    }
    // Actualizar en BD
    await updateTask(taskId, updates)
    // No recargar para mantener la reactividad local
  } catch (err) {
    alert('Error al actualizar la tarea. Por favor, intenta nuevamente.')
    // Recargar para restaurar estado
    await loadTasks()
  }
}

async function handleTaskDelete(taskId: string) {
  try {
    await removeTask(taskId)
    // Recargar tareas para sincronizar
    await loadTasks()
  } catch (err) {
    alert('Error al eliminar la tarea. Por favor, intenta nuevamente.')
  }
}

async function handleTaskMove(taskId: string, newColumnId: string, newOrder: number) {
  try {
    // Actualizar localmente primero para reactividad inmediata
    const task = tasks.value.find(t => t.id === taskId)
    if (task) {
      task.column_id = newColumnId
      task.order = newOrder
    }
    
    // Reordenar tareas en la columna destino
    const destTasks = tasks.value.filter(t => t.column_id === newColumnId && t.id !== taskId)
    const updates = destTasks.map((task, index) => ({
      id: task.id,
      order: index >= newOrder ? index + 1 : index
    }))
    updates.push({ id: taskId, order: newOrder })
    
    // Actualizar en BD
    await moveTask(taskId, newColumnId, newOrder)
    if (updates.length > 1) {
      await reorderTasks(updates)
    }
    // Recargar tareas para sincronizar (en background)
    loadTasks().catch(() => {})
  } catch (err) {
    alert('Error al mover la tarea. Por favor, intenta nuevamente.')
    // Recargar para restaurar estado
    await loadTasks()
  }
}

async function handleTaskReorder(columnId: string, updates: Array<{ id: string; order: number }>) {
  try {
    await reorderTasks(updates)
    await loadTasks() // Recargar para sincronizar
  } catch (err) {
    alert('Error al reordenar las tareas. Por favor, intenta nuevamente.')
    await loadTasks() // Recargar para restaurar estado
  }
}
</script>

<style scoped>
.board {
  min-height: 100vh;
  padding: var(--spacing-md) var(--spacing-lg);
  display: flex;
  flex-direction: column;
}

@media (max-width: 768px) {
  .board {
    padding: var(--spacing-sm) var(--spacing-md);
  }
}

.board__header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
  flex-wrap: wrap;
}

.board__name {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--text-primary);
  cursor: pointer;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  transition: background-color var(--transition-fast);
  flex: 1;
  min-width: 200px;
}

.board__name:hover {
  background: var(--bg-secondary);
}

.board__name-input {
  flex: 1;
  font-size: var(--font-size-2xl);
  font-weight: 700;
  background: var(--bg-secondary);
  border: 2px solid var(--postit-blue);
  min-width: 200px;
}

.board__add-column {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--postit-blue);
  color: white;
  border-radius: var(--border-radius-md);
  font-weight: 500;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.board__add-column:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.board__columns-wrapper {
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: var(--spacing-md);
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
}

@media (max-width: 768px) {
  .board__columns-wrapper {
    padding-bottom: var(--spacing-sm);
  }
}

.board__columns {
  display: flex;
  gap: var(--spacing-md);
  align-items: flex-start;
  min-width: fit-content;
  padding-bottom: var(--spacing-sm);
  width: 100%;
}

@media (max-width: 768px) {
  .board__columns {
    gap: var(--spacing-sm);
  }
}

.board__add-column-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.board__add-column-form {
  background: var(--bg-secondary);
  padding: var(--spacing-xl);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  min-width: 300px;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@media (max-width: 768px) {
  .board__add-column-form {
    min-width: 90%;
    max-width: 90%;
    padding: var(--spacing-lg);
  }
}

.board__column-input {
  width: 100%;
  font-size: var(--font-size-base);
}

.board__form-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.board__form-button {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  font-weight: 500;
  transition: all var(--transition-fast);
}

.board__form-button--primary {
  background: var(--postit-blue);
  color: white;
}

.board__form-button--primary:hover:not(:disabled) {
  opacity: 0.9;
}

.board__form-button:not(.board__form-button--primary) {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.board__form-button:not(.board__form-button--primary):hover {
  background: var(--bg-primary);
}

.board__loading,
.board__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl);
  color: var(--text-secondary);
  font-size: var(--font-size-base);
  min-height: 200px;
}

.board__form-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin-bottom: var(--spacing-md);
  color: var(--text-primary);
}

.board__form-error {
  color: #d32f2f;
  font-size: var(--font-size-sm);
  margin-top: var(--spacing-xs);
  margin-bottom: var(--spacing-sm);
}

.board__loading,
.board__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl);
  color: var(--text-secondary);
  font-size: var(--font-size-base);
  min-height: 200px;
}
</style>
