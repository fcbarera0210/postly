<template>
  <div class="board">
    <div class="board__header">
      <div class="board__header-title">
        <img 
          src="/logo-svg/Logo-Postly.svg" 
          alt="Postly Logo" 
          class="board__logo"
        />
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
          @touchstart.stop="handleTouchStart"
          @touchend.stop="handleTouchEnd"
          @touchmove.stop="handleTouchMove"
        >
          {{ board?.name || 'Mi Tablero' }}
        </h1>
        <div class="board__header-actions">
          <NuxtLink to="/boards" class="board__icon-link" title="Ver todos los tableros" aria-label="Ver todos los tableros">
            <span class="board__icon-link-text">Tableros</span>
          </NuxtLink>
          <button
            type="button"
            class="board__icon-btn"
            title="Copiar ID del tablero"
            aria-label="Copiar ID del tablero"
            @click="copyBoardId"
          >
            <ClipboardDocumentIcon class="board__icon-svg" />
          </button>
          <span class="board__visually-hidden" aria-live="polite">{{ copyBoardFeedback }}</span>
          <button
            v-if="boardRole === 'owner'"
            type="button"
            class="board__icon-btn"
            title="Solicitudes de acceso"
            aria-label="Solicitudes de acceso"
            @click="openRequests"
          >
            <InboxArrowDownIcon class="board__icon-svg" />
            <span v-if="pendingCount" class="board__badge">{{ pendingCount }}</span>
          </button>
          <button
            type="button"
            class="board__icon-btn"
            title="Miembros"
            aria-label="Miembros"
            @click="openMembers"
          >
            <UserGroupIcon class="board__icon-svg" />
          </button>
          <button
            type="button"
            class="board__add-column-icon"
            title="Agregar columna"
            aria-label="Agregar columna"
            @click="showAddColumn = true"
          >
            <PlusIcon />
          </button>
          <button
            type="button"
            class="board__logout-icon"
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            @click="handleLogout"
          >
            <ArrowRightOnRectangleIcon />
          </button>
        </div>
      </div>
    </div>

    <Glossary
      v-if="props.boardId"
      :board-id="props.boardId"
      @create-task="handleCreateTaskFromGlossary"
    />

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
          :add-task-trigger="columnAddTriggers[column.id] || null"
          @task-create="handleTaskCreate"
          @task-delete="handleTaskDelete"
          @task-open-detail="handleTaskOpenDetail"
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

    <div v-if="showRequestsModal" class="board__add-column-modal" @click.self="showRequestsModal = false">
      <div class="board__add-column-form board__modal--wide">
        <h3 id="requests-modal-title" class="board__form-title">Solicitudes pendientes</h3>
        <p v-if="!pendingRequests.length" class="board__modal-empty">No hay solicitudes pendientes.</p>
        <ul v-else class="board__request-list">
          <li v-for="r in pendingRequests" :key="r.id" class="board__request-item">
            <span class="board__request-email">{{ userLabel(r) }}</span>
            <div class="board__request-actions">
              <button type="button" class="board__form-button board__form-button--primary" @click="respondRequest(r.id, 'accept')">
                Aceptar
              </button>
              <button type="button" class="board__form-button" @click="respondRequest(r.id, 'reject')">
                Rechazar
              </button>
            </div>
          </li>
        </ul>
        <template v-if="requestHistory.length">
          <h4 class="board__task-detail-heading board__history-heading">Últimas resoluciones</h4>
          <ul class="board__history-list">
            <li v-for="h in requestHistory" :key="h.id" class="board__history-item">
              <span class="board__history-main">{{ userLabel({ email: h.requester_email, display_name: h.requester_display_name }) }}</span>
              <span class="board__history-meta">
                {{ h.status === 'accepted' ? 'Aceptada' : 'Rechazada' }}
                <template v-if="h.resolved_at"> · {{ formatLocaleDateTime(h.resolved_at) }}</template>
              </span>
              <span v-if="h.resolver_email" class="board__history-resolver">
                Por {{ userLabel({ email: h.resolver_email, display_name: h.resolver_display_name }) }}
              </span>
            </li>
          </ul>
        </template>
        <button type="button" class="board__form-button" @click="showRequestsModal = false">Cerrar</button>
      </div>
    </div>

    <div v-if="showMembersModal" class="board__add-column-modal" @click.self="showMembersModal = false">
      <div class="board__add-column-form board__modal--wide">
        <h3 class="board__form-title">Miembros</h3>
        <ul class="board__member-list">
          <li v-for="m in members" :key="m.user_id" class="board__member-item">
            <span>{{ userLabel(m) }}</span>
            <span class="board__member-role">{{ m.role === 'owner' ? 'Dueño' : 'Editor' }}</span>
            <button
              v-if="boardRole === 'owner' && m.role === 'editor'"
              type="button"
              class="board__form-button board__form-button--small"
              @click="removeMember(m.user_id)"
            >
              Quitar
            </button>
          </li>
        </ul>
        <button type="button" class="board__form-button" @click="showMembersModal = false">Cerrar</button>
      </div>
    </div>

    <div
      v-if="showTaskDetailModal && taskDetailId"
      class="board__add-column-modal"
      @click.self="closeTaskDetail"
    >
      <div class="board__add-column-form board__modal--task-detail" @click.stop>
        <div v-if="taskDetailLoading" class="board__modal-empty">Cargando…</div>
        <template v-else-if="taskDetail">
          <p class="board__task-detail-meta board__task-detail-meta--first">
            Creada: {{ formatLocaleDateTime(taskDetail.task.created_at) }}
          </p>

          <section class="board__task-detail-section">
            <h4 class="board__task-detail-heading">Título y color</h4>
            <label class="board__sr-only" for="task-detail-title-input">Título de la tarea</label>
            <input
              id="task-detail-title-input"
              v-model="taskEditTitle"
              class="board__column-input board__task-detail-title-field"
              type="text"
              maxlength="200"
              autocomplete="off"
            />
            <p
              v-if="taskEditTitle.length > 0 && taskEditTitle.trim().length < 3"
              class="board__form-error board__task-detail-field-error"
            >
              El título debe tener al menos 3 caracteres
            </p>
            <div class="board__task-detail-color-row" role="group" aria-label="Color de la tarjeta">
              <button
                v-for="c in POSTIT_COLOR_OPTIONS"
                :key="c.value"
                type="button"
                class="board__task-detail-color-swatch"
                :class="{ 'board__task-detail-color-swatch--active': taskEditColor === c.value }"
                :style="{ backgroundColor: c.bg }"
                :title="c.label"
                :aria-label="`Color ${c.label}`"
                @click="taskEditColor = c.value"
              />
              <button
                type="button"
                class="board__task-detail-color-swatch board__task-detail-color-swatch--clear"
                :class="{ 'board__task-detail-color-swatch--active': taskEditColor === null }"
                title="Sin color"
                aria-label="Sin color"
                @click="taskEditColor = null"
              >
                ×
              </button>
            </div>
          </section>

          <section class="board__task-detail-section">
            <h4 class="board__task-detail-heading">Descripción</h4>
            <p class="board__task-detail-hint">
              Texto opcional con formato Markdown (negritas, listas, enlaces). Sin adjuntos.
            </p>
            <TaskDescriptionEditor v-model="taskEditDescription" />
          </section>

          <section class="board__task-detail-section board__task-detail-section--save">
            <button
              type="button"
              class="board__form-button board__form-button--primary"
              :disabled="!taskMetaDirty || taskEditTitle.trim().length < 3"
              @click="saveTaskDetailMeta"
            >
              Guardar cambios
            </button>
          </section>

          <section class="board__task-detail-section">
            <h4 class="board__task-detail-heading">Responsables</h4>
            <div class="board__assignee-chips">
              <span
                v-for="a in taskDetail.assignees"
                :key="a.user_id"
                class="board__assignee-chip"
              >
                {{ userLabel(a) }}
                <button
                  type="button"
                  class="board__assignee-chip-remove"
                  title="Quitar responsable"
                  aria-label="Quitar responsable"
                  @click="handleRemoveAssignee(a.user_id)"
                >
                  ×
                </button>
              </span>
              <span v-if="!taskDetail.assignees.length" class="board__modal-empty board__inline-empty">
                Sin responsables
              </span>
            </div>
            <div v-if="assigneePickerOptions.length" class="board__assignee-add">
              <label class="board__sr-only" for="task-assignee-select">Añadir responsable</label>
              <select
                id="task-assignee-select"
                v-model="selectedAssigneeUserId"
                class="board__task-detail-select"
              >
                <option value="">Añadir miembro…</option>
                <option v-for="m in assigneePickerOptions" :key="m.user_id" :value="m.user_id">
                  {{ userLabel(m) }} ({{ m.role === 'owner' ? 'Dueño' : 'Editor' }})
                </option>
              </select>
              <button
                type="button"
                class="board__form-button board__form-button--primary board__form-button--narrow"
                :disabled="!selectedAssigneeUserId"
                @click="handleAddAssignee"
              >
                Añadir
              </button>
            </div>
          </section>

          <section class="board__task-detail-section">
            <h4 class="board__task-detail-heading">Comentarios</h4>
            <ul class="board__comment-list">
              <li v-for="c in taskDetail.comments" :key="c.id" class="board__comment-item">
                <div class="board__comment-header">
                  <span class="board__comment-author">{{ userLabel({ email: c.author_email, display_name: c.author_display_name }) }}</span>
                  <span class="board__comment-date">{{ formatLocaleDateTime(c.created_at) }}</span>
                  <button
                    v-if="currentUserId && c.author_id === currentUserId"
                    type="button"
                    class="board__comment-delete"
                    title="Eliminar comentario"
                    @click="handleDeleteComment(c.id)"
                  >
                    Eliminar
                  </button>
                </div>
                <p class="board__comment-body">{{ c.body }}</p>
              </li>
            </ul>
            <p v-if="!taskDetail.comments.length" class="board__modal-empty board__inline-empty">
              Aún no hay comentarios.
            </p>
            <div class="board__comment-form">
              <textarea
                v-model="newCommentText"
                class="board__comment-textarea"
                rows="3"
                maxlength="8000"
                placeholder="Escribe un comentario…"
              />
              <button
                type="button"
                class="board__form-button board__form-button--primary"
                :disabled="!newCommentText.trim()"
                @click="submitComment"
              >
                Publicar
              </button>
            </div>
          </section>
        </template>
        <p v-else-if="taskDetailError" class="board__form-error">{{ taskDetailError }}</p>
        <button type="button" class="board__form-button" @click="closeTaskDetail">Cerrar</button>
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
import { ref, computed, watch, nextTick, toRef, onMounted } from 'vue'
import {
  PlusIcon,
  ArrowRightOnRectangleIcon,
  UserGroupIcon,
  ClipboardDocumentIcon,
  InboxArrowDownIcon
} from '@heroicons/vue/24/outline'
import Column from './Column.vue'
import Glossary from './Glossary.vue'
import TaskDescriptionEditor from './TaskDescriptionEditor.vue'
import { useBoard } from '~/composables/useBoard'
import { useColumns } from '~/composables/useColumns'
import { useTasks } from '~/composables/useTasks'
import { useTaskDetail } from '~/composables/useTaskDetail'
import { useAuth } from '~/composables/useAuth'
import { apiFetch } from '~/composables/useApi'
import { userLabel } from '~/utils/userLabel'
import { formatLocaleDateTime } from '~/utils/formatDate'
import { POSTIT_COLOR_OPTIONS } from '~/utils/postitColors'
import type {
  Column as ColumnType,
  Task,
  GlossaryItem,
  AccessRequestRow,
  AccessRequestResolutionRow,
  BoardMemberRow,
  BoardRequestsPayload
} from '~/utils/types'

const props = defineProps<{ boardId: string }>()

const boardIdRef = toRef(props, 'boardId')
const { board, boardRole, updateName } = useBoard(boardIdRef)
const boardId = computed(() => props.boardId || null)
const { columns, loading: columnsLoading, canDelete: columnsCanDelete, loadColumns, create: createColumn, remove: removeColumn, update: updateColumn, reorder: reorderColumns } = useColumns(boardId)
const loading = computed(() => columnsLoading.value)
const { tasks, loadTasks, create: createTask, remove: removeTask, update: updateTask, move: moveTask, reorder: reorderTasks } = useTasks(boardId)
const { logout, getCurrentUser } = useAuth()

const boardIdForDetail = toRef(props, 'boardId')
const {
  detail: taskDetail,
  loading: taskDetailLoading,
  error: taskDetailErrorRef,
  loadDetail,
  clearDetail,
  addComment,
  deleteComment,
  addAssignee,
  removeAssignee
} = useTaskDetail(boardIdForDetail)

const showTaskDetailModal = ref(false)
const taskDetailId = ref<string | null>(null)
const newCommentText = ref('')
const selectedAssigneeUserId = ref('')
const currentUserId = ref<string | null>(null)

const taskDetailError = computed(() => taskDetailErrorRef.value)

const taskEditTitle = ref('')
const taskEditColor = ref<string | null>(null)
const taskEditDescription = ref('')

function normalizeTaskDescription(s: string | null | undefined): string {
  return (s ?? '').trim()
}

watch(
  () => taskDetail.value?.task,
  (t) => {
    if (!t) return
    taskEditTitle.value = t.title
    taskEditColor.value = t.color
    taskEditDescription.value = t.description ?? ''
  },
  { immediate: true }
)

const taskMetaDirty = computed(() => {
  const d = taskDetail.value
  if (!d?.task) return false
  const t = d.task
  return (
    taskEditTitle.value.trim() !== t.title ||
    taskEditColor.value !== t.color ||
    normalizeTaskDescription(taskEditDescription.value) !== normalizeTaskDescription(t.description ?? '')
  )
})

const assigneePickerOptions = computed(() => {
  if (!members.value.length || !taskDetail.value) return []
  const assigned = new Set(taskDetail.value.assignees.map((a) => a.user_id))
  return members.value.filter((m) => !assigned.has(m.user_id))
})

onMounted(async () => {
  const u = await getCurrentUser()
  currentUserId.value = u?.id ?? null
})

async function handleTaskOpenDetail(taskId: string) {
  taskDetailId.value = taskId
  showTaskDetailModal.value = true
  newCommentText.value = ''
  selectedAssigneeUserId.value = ''
  await refreshMembers()
  await loadDetail(taskId)
}

function closeTaskDetail() {
  showTaskDetailModal.value = false
  taskDetailId.value = null
  clearDetail()
  newCommentText.value = ''
  selectedAssigneeUserId.value = ''
  loadTasks({ silent: true }).catch(() => {})
}

async function submitComment() {
  const tid = taskDetailId.value
  if (!tid || !newCommentText.value.trim()) return
  try {
    await addComment(tid, newCommentText.value.trim())
    newCommentText.value = ''
  } catch (e) {
    alert(e instanceof Error ? e.message : 'No se pudo publicar el comentario')
  }
}

async function handleDeleteComment(commentId: string) {
  const tid = taskDetailId.value
  if (!tid || !confirm('¿Eliminar este comentario?')) return
  try {
    await deleteComment(tid, commentId)
  } catch (e) {
    alert(e instanceof Error ? e.message : 'No se pudo eliminar')
  }
}

async function handleAddAssignee() {
  const tid = taskDetailId.value
  const uid = selectedAssigneeUserId.value
  if (!tid || !uid) return
  try {
    await addAssignee(tid, uid)
    selectedAssigneeUserId.value = ''
    await loadTasks({ silent: true })
  } catch (e) {
    alert(e instanceof Error ? e.message : 'No se pudo asignar')
  }
}

async function handleRemoveAssignee(userId: string) {
  const tid = taskDetailId.value
  if (!tid) return
  try {
    await removeAssignee(tid, userId)
    await loadTasks({ silent: true })
  } catch (e) {
    alert(e instanceof Error ? e.message : 'No se pudo quitar el responsable')
  }
}

const showRequestsModal = ref(false)
const showMembersModal = ref(false)
const pendingRequests = ref<AccessRequestRow[]>([])
const requestHistory = ref<AccessRequestResolutionRow[]>([])
const members = ref<BoardMemberRow[]>([])
let copyBoardTimer: ReturnType<typeof setTimeout> | null = null
const copyBoardFeedback = ref('')
const pendingCount = computed(() => pendingRequests.value.length)

async function refreshPendingRequests() {
  if (boardRole.value !== 'owner' || !props.boardId) return
  try {
    const data = await apiFetch<BoardRequestsPayload>(`/api/boards/${props.boardId}/requests`)
    pendingRequests.value = data.pending
    requestHistory.value = data.history
  } catch {
    pendingRequests.value = []
    requestHistory.value = []
  }
}

async function refreshMembers() {
  if (!props.boardId) return
  try {
    members.value = await apiFetch<BoardMemberRow[]>(`/api/boards/${props.boardId}/members`)
  } catch {
    members.value = []
  }
}

function openRequests() {
  showRequestsModal.value = true
  refreshPendingRequests()
}

function openMembers() {
  showMembersModal.value = true
  refreshMembers()
}

async function respondRequest(requestId: string, action: 'accept' | 'reject') {
  try {
    await apiFetch(`/api/boards/${props.boardId}/requests/${requestId}/respond`, {
      method: 'POST',
      body: { action }
    })
    await refreshPendingRequests()
    await refreshMembers()
  } catch (e) {
    alert(e instanceof Error ? e.message : 'Error al procesar la solicitud')
  }
}

async function removeMember(userId: string) {
  if (!confirm('¿Quitar a este miembro del tablero?')) return
  try {
    await apiFetch(`/api/boards/${props.boardId}/members/${userId}`, { method: 'DELETE' })
    await refreshMembers()
  } catch (e) {
    alert(e instanceof Error ? e.message : 'Error al quitar miembro')
  }
}

function copyBoardId() {
  if (!import.meta.client || !navigator.clipboard) return
  navigator.clipboard.writeText(props.boardId).then(() => {
    copyBoardFeedback.value = 'ID copiado'
    if (copyBoardTimer) clearTimeout(copyBoardTimer)
    copyBoardTimer = setTimeout(() => {
      copyBoardFeedback.value = ''
    }, 2500)
  }).catch(() => {})
}

const isEditingName = ref(false)
const editedName = ref('')
const nameInputRef = ref<HTMLInputElement | null>(null)
const showAddColumn = ref(false)
const newColumnTitle = ref('')
const columnInputRef = ref<HTMLInputElement | null>(null)

// Long press para móvil
let longPressTimer: ReturnType<typeof setTimeout> | null = null
const LONG_PRESS_DURATION = 500 // ms

const localColumns = ref<ColumnType[]>([])

// Objeto reactivo para triggers de agregar tarea por columna
const columnAddTriggers = ref<Record<string, { color: string | null; title?: string } | null>>({})

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

watch(
  () => props.boardId,
  async (id) => {
    if (!id) return
    await loadColumns()
    await loadTasks()
    if (columns.value.length > 0 && localColumns.value.length === 0) {
      localColumns.value = [...columns.value]
    }
    await refreshPendingRequests()
  },
  { immediate: true }
)

watch(boardRole, () => {
  refreshPendingRequests()
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

// Handlers para long press en móvil
function handleTouchStart(e: TouchEvent) {
  // Solo activar si no está en modo edición
  if (isEditingName.value) return
  
  // Prevenir zoom accidental
  e.preventDefault()
  
  longPressTimer = setTimeout(() => {
    startEditName()
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
    await nextTick()
  } catch (err) {
    alert('Error al crear la tarea. Por favor, intenta nuevamente.')
  }
}

async function handleTaskUpdate(
  taskId: string,
  updates: { title?: string; color?: string | null; description?: string | null }
) {
  try {
    const task = tasks.value.find((t) => t.id === taskId)
    if (task) {
      if (updates.title !== undefined) task.title = updates.title
      if (updates.color !== undefined) task.color = updates.color
      if (updates.description !== undefined) task.description = updates.description
    }
    await updateTask(taskId, updates)
  } catch (err) {
    alert('Error al actualizar la tarea. Por favor, intenta nuevamente.')
    await loadTasks({ silent: true })
    throw err
  }
}

async function saveTaskDetailMeta() {
  const tid = taskDetailId.value
  if (!tid || !taskDetail.value) return
  const title = taskEditTitle.value.trim()
  if (title.length < 3) {
    alert('El título debe tener al menos 3 caracteres.')
    return
  }
  try {
    const descriptionNorm = normalizeTaskDescription(taskEditDescription.value)
    await handleTaskUpdate(tid, {
      title,
      color: taskEditColor.value,
      description: descriptionNorm.length ? descriptionNorm : null
    })
    await loadDetail(tid)
    await loadTasks({ silent: true })
  } catch {
    // handleTaskUpdate ya mostró error y sincronizó
  }
}

async function handleTaskDelete(taskId: string) {
  try {
    await removeTask(taskId)
    await loadTasks({ silent: true })
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
    loadTasks({ silent: true }).catch(() => {})
  } catch (err) {
    alert('Error al mover la tarea. Por favor, intenta nuevamente.')
    await loadTasks({ silent: true })
  }
}

async function handleTaskReorder(columnId: string, updates: Array<{ id: string; order: number }>) {
  try {
    await reorderTasks(updates)
    await loadTasks({ silent: true })
  } catch (err) {
    alert('Error al reordenar las tareas. Por favor, intenta nuevamente.')
    await loadTasks({ silent: true })
  }
}

function handleCreateTaskFromGlossary(glossaryItem: GlossaryItem) {
  // Encontrar la primera columna (menor order)
  if (localColumns.value.length === 0) {
    return
  }
  
  const firstColumn = localColumns.value.reduce((prev, current) => {
    return (prev.order < current.order) ? prev : current
  })
  
  // Actualizar el trigger para abrir el formulario en esa columna
  // Primero resetear a null para que el watch detecte el cambio
  columnAddTriggers.value[firstColumn.id] = null
  nextTick(() => {
    // Luego establecer el trigger con el color y el título del glosario
    columnAddTriggers.value[firstColumn.id] = { 
      color: glossaryItem.color,
      title: glossaryItem.name
    }
    
    // Resetear después de un momento para permitir que se active nuevamente si es necesario
    setTimeout(() => {
      columnAddTriggers.value[firstColumn.id] = null
    }, 100)
  })
}

function handleLogout() {
  logout()
  // Recargar la página para volver a la pantalla de login
  window.location.reload()
}
</script>

<style scoped>
.board {
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
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-2xl);
  flex-wrap: wrap;
}

.board__header-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex: 1;
  min-width: 200px;
}

.board__logo {
  height: 40px;
  width: auto;
  object-fit: contain;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .board__logo {
    height: 32px;
  }
}

.board__name {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  color: var(--text-primary);
  cursor: pointer;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  transition: background-color var(--transition-base), transform var(--transition-fast);
  flex: 1;
  min-width: 200px;
  letter-spacing: -0.02em;
}

.board__name:active {
  transform: scale(0.98);
}

.board__name:hover {
  background: var(--bg-secondary);
}

.board__name-input {
  flex: 1;
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  background: var(--bg-secondary);
  border: 2px solid var(--brand-primary);
  min-width: 200px;
  letter-spacing: -0.02em;
}

.board__header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-shrink: 0;
  margin-left: auto;
  flex-wrap: wrap;
}

.board__icon-link {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--brand-primary);
  text-decoration: none;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-md);
}

.board__icon-link:hover {
  background: var(--bg-secondary);
}

.board__icon-link-text {
  white-space: nowrap;
}

.board__icon-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--border-radius-md);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  cursor: pointer;
  transition: all var(--transition-base);
}

.board__icon-btn:hover {
  background: var(--bg-primary);
  transform: translateY(-2px);
}

.board__icon-svg {
  width: 20px;
  height: 20px;
}

.board__badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  font-size: 11px;
  font-weight: 700;
  line-height: 18px;
  text-align: center;
  background: var(--brand-primary);
  color: white;
  border-radius: 999px;
}

.board__visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.board__history-heading {
  margin-top: var(--spacing-lg);
  margin-bottom: var(--spacing-sm);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-secondary);
}

.board__history-list {
  list-style: none;
  padding: 0;
  margin: 0 0 var(--spacing-md);
  max-height: 200px;
  overflow-y: auto;
}

.board__history-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--border-color);
  font-size: var(--font-size-xs);
}

.board__history-main {
  font-weight: var(--font-weight-medium);
  word-break: break-all;
}

.board__history-meta,
.board__history-resolver {
  color: var(--text-secondary);
}

.board__modal--wide {
  max-width: 420px;
}

.board__modal--task-detail {
  max-width: 480px;
  max-height: 85vh;
  overflow-y: auto;
  width: 100%;
}

.board__task-detail-title-field {
  width: 100%;
  box-sizing: border-box;
  margin-bottom: var(--spacing-xs);
}

.board__task-detail-field-error {
  margin-top: 0;
  margin-bottom: var(--spacing-sm);
}

.board__task-detail-color-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-md);
  align-items: center;
}

.board__task-detail-color-swatch {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  flex-shrink: 0;
  padding: 0;
  transition:
    transform var(--transition-base),
    border-color var(--transition-base),
    box-shadow var(--transition-base);
}

.board__task-detail-color-swatch:hover {
  transform: scale(1.08);
}

.board__task-detail-color-swatch--active {
  border-color: var(--brand-primary);
  box-shadow: var(--shadow-sm);
}

.board__task-detail-color-swatch--clear {
  background: rgba(255, 255, 255, 0.35);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  line-height: 1;
  font-weight: bold;
  color: var(--text-secondary);
}

.board__task-detail-meta {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-md);
}

.board__task-detail-meta--first {
  margin-top: 0;
}

.board__task-detail-hint {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-sm);
  line-height: var(--line-height-relaxed);
}

.board__task-detail-section--save {
  margin-top: calc(-1 * var(--spacing-sm));
  margin-bottom: var(--spacing-lg);
}

.board__task-detail-section {
  margin-bottom: var(--spacing-lg);
}

.board__task-detail-heading {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-sm);
}

.board__assignee-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-sm);
}

.board__assignee-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-xs);
  max-width: 100%;
  word-break: break-all;
}

.board__assignee-chip-remove {
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  padding: 0 2px;
}

.board__assignee-chip-remove:hover {
  color: #d32f2f;
}

.board__assignee-add {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  align-items: center;
}

.board__task-detail-select {
  flex: 1;
  min-width: 160px;
  font-size: var(--font-size-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  color: var(--text-primary);
}

.board__form-button--narrow {
  flex: 0 0 auto;
}

.board__inline-empty {
  margin: 0;
  font-size: var(--font-size-sm);
}

.board__comment-list {
  list-style: none;
  padding: 0;
  margin: 0 0 var(--spacing-md);
  max-height: 220px;
  overflow-y: auto;
}

.board__comment-item {
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--border-color);
}

.board__comment-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
}

.board__comment-author {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  word-break: break-all;
}

.board__comment-date {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.board__comment-delete {
  margin-left: auto;
  border: none;
  background: none;
  color: var(--brand-primary);
  font-size: var(--font-size-xs);
  cursor: pointer;
  padding: 0;
}

.board__comment-delete:hover {
  text-decoration: underline;
}

.board__comment-body {
  margin: 0;
  font-size: var(--font-size-sm);
  white-space: pre-wrap;
  word-break: break-word;
}

.board__comment-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.board__comment-textarea {
  width: 100%;
  font-size: var(--font-size-sm);
  font-family: inherit;
  padding: var(--spacing-sm);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  color: var(--text-primary);
  resize: vertical;
  min-height: 72px;
}

.board__sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.board__modal-empty {
  color: var(--text-secondary);
  margin-bottom: var(--spacing-md);
}

.board__request-list,
.board__member-list {
  list-style: none;
  padding: 0;
  margin: 0 0 var(--spacing-md);
  max-height: 280px;
  overflow-y: auto;
}

.board__request-item,
.board__member-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--border-color);
  flex-wrap: wrap;
}

.board__request-email {
  font-size: var(--font-size-sm);
  flex: 1;
  min-width: 0;
  word-break: break-all;
}

.board__request-actions {
  display: flex;
  gap: var(--spacing-xs);
}

.board__member-role {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.board__form-button--small {
  flex: 0 0 auto;
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-xs);
}

.board__add-column-icon,
.board__logout-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--border-radius-md);
  transition: all var(--transition-base);
  cursor: pointer;
  flex-shrink: 0;
}

.board__add-column-icon svg,
.board__logout-icon svg {
  width: 20px;
  height: 20px;
}

.board__add-column-icon {
  background: var(--brand-primary);
  color: white;
  border: none;
}

.board__add-column-icon:hover {
  background: var(--brand-primary-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.board__add-column-icon:active {
  background: var(--brand-primary-active);
  transform: translateY(0);
}

.board__logout-icon {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.board__logout-icon:hover {
  background: var(--bg-primary);
  border-color: var(--text-secondary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.board__logout-icon:active {
  transform: translateY(0);
}

@media (max-width: 768px) {
  .board__add-column-icon,
  .board__logout-icon {
    width: 32px;
    height: 32px;
  }
  
  .board__add-column-icon svg,
  .board__logout-icon svg {
    width: 18px;
    height: 18px;
  }
}

.board__columns-wrapper {
  flex: 1;
  overflow-x: auto;
  overflow-y: visible;
  padding-bottom: var(--spacing-md);
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: var(--border-color) var(--bg-tertiary);
}

.board__columns-wrapper::-webkit-scrollbar {
  height: 12px;
}

.board__columns-wrapper::-webkit-scrollbar-track {
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-sm);
}

.board__columns-wrapper::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: var(--border-radius-sm);
}

.board__columns-wrapper::-webkit-scrollbar-thumb:hover {
  background: var(--text-tertiary);
}

@media (max-width: 768px) {
  .board__columns-wrapper {
    padding-bottom: var(--spacing-sm);
  }
}

.board__columns {
  display: flex;
  gap: var(--spacing-lg);
  align-items: flex-start;
  min-width: fit-content;
  padding-bottom: var(--spacing-md);
  width: 100%;
}

@media (max-width: 768px) {
  .board__columns {
    gap: var(--spacing-md);
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
  box-shadow: var(--shadow-xl);
  min-width: 300px;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  animation: fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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
  font-weight: var(--font-weight-medium);
  transition: all var(--transition-base);
}

.board__form-button--primary {
  background: var(--brand-primary);
  color: white;
}

.board__form-button--primary:hover:not(:disabled) {
  background: var(--brand-primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.board__form-button--primary:active:not(:disabled) {
  background: var(--brand-primary-active);
  transform: translateY(0);
}

.board__form-button:not(.board__form-button--primary) {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.board__form-button:not(.board__form-button--primary):hover {
  background: var(--bg-primary);
  border-color: var(--text-secondary);
}

.board__form-button:not(.board__form-button--primary):active {
  transform: scale(0.98);
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
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
  margin-bottom: var(--spacing-md);
  color: var(--text-primary);
  letter-spacing: -0.01em;
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
