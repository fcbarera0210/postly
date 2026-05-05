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

    <AssigneeFilter
      v-if="props.boardId"
      :options="assigneesOnBoard"
      :model-value="assigneeQueryId"
      @update:model-value="setAssigneeQuery"
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
          @open-create-task="openCreateTaskDetail"
          @task-delete="openDeleteTaskConfirm"
          @task-open-detail="handleTaskOpenDetail"
          @task-move="handleTaskMove"
          @task-reorder="handleTaskReorder"
          @update-title="handleColumnUpdate"
          @delete="() => openDeleteColumnConfirm(column.id)"
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
      v-if="showTaskDetailModal && (taskDetailId || taskDetailCreateColumnId)"
      class="board__add-column-modal"
      @click.self="closeTaskDetail"
    >
      <div class="board__add-column-form board__modal--task-detail" @click.stop>
        <div v-if="taskDetailLoading && taskDetailId && !taskDetailCreateColumnId" class="board__task-detail-modal-body">
          <div class="board__task-detail-topbar">
            <p class="board__task-detail-meta board__task-detail-meta--topbar">Cargando…</p>
            <button type="button" class="board__task-detail-close-btn" @click="closeTaskDetail">Cerrar</button>
          </div>
        </div>
        <template v-else-if="taskDetailCreateColumnId">
          <div class="board__task-detail-modal-body">
            <div class="board__task-detail-topbar">
              <p class="board__task-detail-meta board__task-detail-meta--topbar">Nueva tarea</p>
              <div class="board__task-detail-topbar-actions">
                <button
                  type="button"
                  class="board__task-detail-close-btn"
                  :disabled="taskDetailSaveDisabled"
                  @click="saveTaskDetailMeta"
                >
                  Guardar cambios
                </button>
                <button
                  type="button"
                  class="board__task-detail-edit-btn"
                  @click="cancelTaskDetailMetaEdit"
                >
                  Cancelar
                </button>
              </div>
            </div>

            <section class="board__task-detail-section board__task-detail-section--title-block">
              <label class="board__sr-only" for="task-detail-new-title-input">Título de la tarea</label>
              <input
                id="task-detail-new-title-input"
                v-model="taskEditTitle"
                class="board__column-input board__task-detail-title-field"
                type="text"
                maxlength="200"
                autocomplete="off"
                placeholder="Título (mín. 3 caracteres)"
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
          </div>
        </template>
        <template v-else-if="taskDetail">
          <div class="board__task-detail-modal-body">
            <div class="board__task-detail-topbar">
              <p class="board__task-detail-meta board__task-detail-meta--topbar">
                Creada: {{ formatDateDMYShortWithTime(taskDetail.task.created_at) }}
              </p>
              <div class="board__task-detail-topbar-actions">
                <template v-if="!taskDetailMetaEditing">
                  <button
                    type="button"
                    class="board__task-detail-edit-btn"
                    aria-label="Editar título, color y descripción"
                    @click="enterTaskDetailMetaEdit"
                  >
                    <PencilSquareIcon class="board__icon-svg board__task-detail-edit-icon" aria-hidden="true" />
                    Editar
                  </button>
                  <button
                    type="button"
                    class="board__task-detail-delete-btn"
                    aria-label="Eliminar tarea"
                    title="Eliminar tarea"
                    @click="openDeleteTaskConfirm(taskDetail.task.id)"
                  >
                    <TrashIcon class="board__icon-svg board__task-detail-delete-icon" aria-hidden="true" />
                  </button>
                  <button type="button" class="board__task-detail-close-btn" @click="closeTaskDetail">Cerrar</button>
                </template>
                <template v-else>
                  <button
                    type="button"
                    class="board__task-detail-close-btn"
                    :disabled="taskDetailSaveDisabled"
                    @click="saveTaskDetailMeta"
                  >
                    Guardar cambios
                  </button>
                  <button
                    type="button"
                    class="board__task-detail-edit-btn"
                    @click="cancelTaskDetailMetaEdit"
                  >
                    Cancelar
                  </button>
                </template>
              </div>
            </div>

            <section class="board__task-detail-section board__task-detail-section--title-block">
              <template v-if="!taskDetailMetaEditing">
                <div class="board__task-detail-title-readonly-row">
                  <span
                    class="board__task-detail-readonly-swatch"
                    :style="{ background: postitBackgroundCss(taskDetail.task.color) }"
                    aria-hidden="true"
                  />
                  <p class="board__task-detail-readonly-title">{{ taskDetail.task.title }}</p>
                </div>
              </template>
              <template v-else>
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
              </template>

              <div class="board__task-detail-assignees-toolbar" role="group" aria-label="Responsables de la tarea">
                <span class="board__task-detail-assignees-label">Responsable:</span>
                <div class="board__task-detail-assignee-strip">
                  <template v-if="!taskDetailMetaEditing">
                    <span
                      v-if="!taskDetail.assignees.length"
                      class="board__task-detail-assignee-chip-pad board__task-detail-assignee-chip-pad--active"
                    >
                      <span
                        class="board__task-detail-assignee-none-inner"
                        role="img"
                        aria-label="Sin responsables asignados"
                      >
                        <UserIcon class="board__task-detail-assignee-user-icon" aria-hidden="true" />
                      </span>
                    </span>
                    <span
                      v-for="a in taskDetail.assignees"
                      :key="a.user_id"
                      class="board__task-detail-assignee-chip-pad"
                    >
                      <span
                        class="board__task-detail-assignee-avatar-inner"
                        :style="{ backgroundColor: taskDetailAssigneeAvatarBg(a.user_id) }"
                        :title="userLabel(a)"
                      >
                        {{ userInitials(a) }}
                      </span>
                    </span>
                  </template>
                  <template v-else>
                    <span
                      v-if="!taskEditAssigneeIds.length"
                      class="board__task-detail-assignee-chip-pad board__task-detail-assignee-chip-pad--active"
                    >
                      <span
                        class="board__task-detail-assignee-none-inner"
                        role="img"
                        aria-label="Sin responsables asignados"
                      >
                        <UserIcon class="board__task-detail-assignee-user-icon" aria-hidden="true" />
                      </span>
                    </span>
                    <span
                      v-for="uid in taskEditAssigneeIds"
                      :key="uid"
                      class="board__task-detail-assignee-chip-pad board__task-detail-assignee-chip-pad--with-remove"
                    >
                      <span
                        v-if="taskDetailPersonForUserId(uid)"
                        class="board__task-detail-assignee-avatar-inner"
                        :style="{ backgroundColor: taskDetailAssigneeAvatarBg(uid) }"
                        :title="userLabel(taskDetailPersonForUserId(uid)!)"
                      >
                        {{ userInitials(taskDetailPersonForUserId(uid)!) }}
                      </span>
                      <button
                        type="button"
                        class="board__task-detail-assignee-remove"
                        title="Quitar responsable"
                        :aria-label="`Quitar a ${taskDetailPersonForUserId(uid) ? userLabel(taskDetailPersonForUserId(uid)!) : uid}`"
                        @click="removeAssigneeFromEdit(uid)"
                      >
                        ×
                      </button>
                    </span>
                    <button
                      v-for="m in assigneePickerOptionsEditing"
                      :key="m.user_id"
                      type="button"
                      class="board__task-detail-assignee-chip-pad board__task-detail-assignee-picker-btn"
                      :title="`${userLabel(m)} (${m.role === 'owner' ? 'Dueño' : 'Editor'})`"
                      :aria-label="`Añadir a ${userLabel(m)}`"
                      @click="stageAddAssignee(m.user_id)"
                    >
                      <span
                        class="board__task-detail-assignee-avatar-inner board__task-detail-assignee-avatar-inner--picker"
                        :style="{ backgroundColor: taskDetailAssigneeAvatarBg(m.user_id) }"
                      >
                        {{ userInitials(m) }}
                      </span>
                    </button>
                  </template>
                </div>
              </div>

              <div v-if="taskDetailMetaEditing" class="board__task-detail-color-row" role="group" aria-label="Color de la tarjeta">
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
            <template v-if="!taskDetailMetaEditing">
              <div
                v-if="taskDetailDescriptionViewHtml"
                class="board__task-detail-description-view markdown-body"
                v-html="taskDetailDescriptionViewHtml"
              />
              <p v-else class="board__modal-empty board__inline-empty board__task-detail-desc-empty">Sin descripción</p>
            </template>
            <template v-else>
              <p class="board__task-detail-hint">
                Texto opcional con formato Markdown (negritas, listas, enlaces). Sin adjuntos.
              </p>
              <TaskDescriptionEditor v-model="taskEditDescription" />
            </template>
          </section>

          <section v-if="!taskDetailMetaEditing" class="board__task-detail-section">
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
                Comentar
              </button>
            </div>
          </section>
          </div>
        </template>
        <div v-else-if="taskDetailError" class="board__task-detail-modal-body">
          <div class="board__task-detail-topbar">
            <p class="board__task-detail-meta board__task-detail-meta--topbar">Detalle de tarea</p>
            <button type="button" class="board__task-detail-close-btn" @click="closeTaskDetail">Cerrar</button>
          </div>
          <p class="board__form-error board__task-detail-error-body">{{ taskDetailError }}</p>
        </div>
      </div>
    </div>

    <div
      v-if="showDeleteColumnModal && pendingDeleteColumn"
      class="board__add-column-modal"
      @click.self="cancelDeleteColumn"
    >
      <div
        ref="deleteColumnDialogRef"
        class="board__add-column-form"
        tabindex="-1"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-column-modal-title"
        @click.stop
        @keydown.escape="cancelDeleteColumn"
      >
        <h3 id="delete-column-modal-title" class="board__form-title">¿Eliminar esta columna?</h3>
        <p class="board__modal-warning-text">
          Vas a eliminar <strong>«{{ pendingDeleteColumn.title }}»</strong>. Las tareas de esta columna se borrarán de
          forma permanente y no se pueden recuperar.
        </p>
        <p v-if="deleteColumnTaskCount > 0" class="board__modal-warning-meta">
          Esta columna tiene {{ deleteColumnTaskCount }}
          {{ deleteColumnTaskCount === 1 ? 'tarea' : 'tareas' }}.
        </p>
        <div class="board__form-actions">
          <button type="button" class="board__form-button board__form-button--danger" @click="confirmDeleteColumn">
            Eliminar columna
          </button>
          <button type="button" class="board__form-button" @click="cancelDeleteColumn">Cancelar</button>
        </div>
      </div>
    </div>

    <div
      v-if="showDeleteTaskModal && pendingDeleteTask"
      class="board__add-column-modal"
      @click.self="cancelDeleteTask"
    >
      <div
        ref="deleteTaskDialogRef"
        class="board__add-column-form"
        tabindex="-1"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-task-modal-title"
        @click.stop
        @keydown.escape="cancelDeleteTask"
      >
        <h3 id="delete-task-modal-title" class="board__form-title">¿Eliminar esta tarea?</h3>
        <p class="board__modal-warning-text">
          Vas a eliminar <strong>«{{ pendingDeleteTask.title }}»</strong>. Se borrará de forma permanente y no se podrá
          recuperar.
        </p>
        <div class="board__form-actions">
          <button type="button" class="board__form-button board__form-button--danger" @click="confirmDeleteTask">
            Eliminar tarea
          </button>
          <button type="button" class="board__form-button" @click="cancelDeleteTask">Cancelar</button>
        </div>
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
  InboxArrowDownIcon,
  PencilSquareIcon,
  TrashIcon,
  UserIcon
} from '@heroicons/vue/24/outline'
import Column from './Column.vue'
import AssigneeFilter from './AssigneeFilter.vue'
import TaskDescriptionEditor from './TaskDescriptionEditor.vue'
import { useBoard } from '~/composables/useBoard'
import { useColumns } from '~/composables/useColumns'
import { useTasks } from '~/composables/useTasks'
import { useTaskDetail } from '~/composables/useTaskDetail'
import { useAuth } from '~/composables/useAuth'
import { apiFetch } from '~/composables/useApi'
import { usePostlyToast } from '~/composables/usePostlyToast'
import { userLabel, userInitials } from '~/utils/userLabel'
import { formatDateDMYShortWithTime, formatLocaleDateTime } from '~/utils/formatDate'
import { POSTIT_COLOR_OPTIONS, postitBackgroundCss } from '~/utils/postitColors'
import { renderMarkdownToSafeHtml } from '~/utils/renderMarkdown'
import type {
  Column as ColumnType,
  Task,
  TaskAssignee,
  AccessRequestRow,
  AccessRequestResolutionRow,
  BoardMemberRow,
  BoardRequestsPayload
} from '~/utils/types'

const props = defineProps<{ boardId: string }>()

const route = useRoute()
const router = useRouter()

const boardIdRef = toRef(props, 'boardId')
const { board, boardRole, updateName } = useBoard(boardIdRef)
const boardId = computed(() => props.boardId || null)
const { columns, loading: columnsLoading, canDelete: columnsCanDelete, loadColumns, create: createColumn, remove: removeColumn, update: updateColumn, reorder: reorderColumns } = useColumns(boardId)
const loading = computed(() => columnsLoading.value)
const { tasks, loadTasks, create: createTask, remove: removeTask, update: updateTask, move: moveTask, reorder: reorderTasks } = useTasks(boardId)
const { logout, getCurrentUser } = useAuth()
const { showError, success, warning, promiseToast } = usePostlyToast()

const boardIdForDetail = toRef(props, 'boardId')
const {
  detail: taskDetail,
  loading: taskDetailLoading,
  error: taskDetailErrorRef,
  loadDetail,
  clearDetail,
  addComment,
  deleteComment
} = useTaskDetail(boardIdForDetail)

const showTaskDetailModal = ref(false)
const showDeleteColumnModal = ref(false)
const pendingDeleteColumn = ref<{ id: string; title: string } | null>(null)
const deleteColumnDialogRef = ref<HTMLElement | null>(null)
const showDeleteTaskModal = ref(false)
const pendingDeleteTask = ref<{ id: string; title: string } | null>(null)
const deleteTaskDialogRef = ref<HTMLElement | null>(null)
const taskDetailId = ref<string | null>(null)
/** Columna destino mientras se crea una tarea nueva desde el modal (sin `taskDetailId` hasta guardar). */
const taskDetailCreateColumnId = ref<string | null>(null)
const newCommentText = ref('')
const currentUserId = ref<string | null>(null)

const taskDetailError = computed(() => taskDetailErrorRef.value)

const taskEditTitle = ref('')
const taskEditColor = ref<string | null>(null)
const taskEditDescription = ref('')
const taskDetailMetaEditing = ref(false)
/** Responsables locales al editar (se persisten al guardar). */
const taskEditAssigneeIds = ref<string[]>([])
/** Copia al entrar en edición para detectar cambios y aplicar diff al guardar. */
const taskMetaAssigneesBaseline = ref<string[]>([])

function normalizeTaskDescription(s: string | null | undefined): string {
  return (s ?? '').trim()
}

function sameAssigneeIdSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const setA = new Set(a)
  if (setA.size !== a.length) return false
  return b.every((id) => setA.has(id))
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
  if (taskDetailCreateColumnId.value) {
    return (
      taskEditTitle.value.trim().length > 0 ||
      taskEditColor.value !== null ||
      normalizeTaskDescription(taskEditDescription.value).length > 0
    )
  }
  const d = taskDetail.value
  if (!d?.task) return false
  const t = d.task
  const metaChanged =
    taskEditTitle.value.trim() !== t.title ||
    taskEditColor.value !== t.color ||
    normalizeTaskDescription(taskEditDescription.value) !== normalizeTaskDescription(t.description ?? '')
  const assigneesChanged =
    taskDetailMetaEditing.value &&
    !sameAssigneeIdSet(taskEditAssigneeIds.value, taskMetaAssigneesBaseline.value)
  return metaChanged || assigneesChanged
})

const taskDetailSaveDisabled = computed(() => {
  if (taskEditTitle.value.trim().length < 3) return true
  if (taskDetailCreateColumnId.value) return false
  return !taskMetaDirty.value
})

const taskDetailDescriptionViewHtml = computed(() => {
  const raw = taskDetail.value?.task?.description ?? ''
  return renderMarkdownToSafeHtml(raw)
})

function taskDetailAssigneeAvatarBg(userId: string): string {
  let n = 0
  for (let i = 0; i < userId.length; i++) {
    n = (n + userId.charCodeAt(i) * (i + 3)) % 360
  }
  return `hsl(${n} 42% 38%)`
}

function taskDetailPersonForUserId(userId: string): { email: string; display_name?: string | null } | null {
  const a = taskDetail.value?.assignees.find((x) => x.user_id === userId)
  if (a) return { email: a.email, display_name: a.display_name }
  const m = members.value.find((x) => x.user_id === userId)
  if (m) return { email: m.email, display_name: m.display_name }
  return null
}

const assigneePickerOptionsEditing = computed(() => {
  if (!taskDetailMetaEditing.value || !members.value.length) return []
  const picked = new Set(taskEditAssigneeIds.value)
  return members.value.filter((m) => !picked.has(m.user_id))
})

function stageAddAssignee(userId: string) {
  if (taskEditAssigneeIds.value.includes(userId)) return
  taskEditAssigneeIds.value = [...taskEditAssigneeIds.value, userId]
}

function removeAssigneeFromEdit(userId: string) {
  taskEditAssigneeIds.value = taskEditAssigneeIds.value.filter((id) => id !== userId)
}

function enterTaskDetailMetaEdit() {
  const d = taskDetail.value
  if (d) {
    const ids = d.assignees.map((a) => a.user_id)
    taskMetaAssigneesBaseline.value = [...ids]
    taskEditAssigneeIds.value = [...ids]
  }
  taskDetailMetaEditing.value = true
}

function cancelTaskDetailMetaEdit() {
  if (taskDetailCreateColumnId.value) {
    if (taskMetaDirty.value) {
      const ok = confirm('¿Descartar los cambios sin guardar?')
      if (!ok) return
    }
    closeTaskDetail()
    return
  }
  if (taskMetaDirty.value) {
    const ok = confirm('¿Descartar los cambios sin guardar?')
    if (!ok) return
  }
  const t = taskDetail.value?.task
  if (t) {
    taskEditTitle.value = t.title
    taskEditColor.value = t.color
    taskEditDescription.value = t.description ?? ''
  }
  const d = taskDetail.value
  if (d) {
    const ids = d.assignees.map((a) => a.user_id)
    taskMetaAssigneesBaseline.value = [...ids]
    taskEditAssigneeIds.value = [...ids]
  }
  taskDetailMetaEditing.value = false
}

onMounted(async () => {
  const u = await getCurrentUser()
  currentUserId.value = u?.id ?? null
})

async function openCreateTaskDetail(columnId: string) {
  taskDetailId.value = null
  taskDetailCreateColumnId.value = columnId
  clearDetail()
  taskEditTitle.value = ''
  taskEditColor.value = null
  taskEditDescription.value = ''
  taskDetailMetaEditing.value = false
  showTaskDetailModal.value = true
  newCommentText.value = ''
  await refreshMembers()
}

async function handleTaskOpenDetail(taskId: string) {
  taskDetailCreateColumnId.value = null
  taskDetailId.value = taskId
  showTaskDetailModal.value = true
  taskDetailMetaEditing.value = false
  newCommentText.value = ''
  await refreshMembers()
  await loadDetail(taskId)
  if (taskDetailErrorRef.value) {
    showError(taskDetailErrorRef.value)
  }
}

function closeTaskDetail() {
  showTaskDetailModal.value = false
  taskDetailId.value = null
  taskDetailCreateColumnId.value = null
  taskDetailMetaEditing.value = false
  taskEditAssigneeIds.value = []
  taskMetaAssigneesBaseline.value = []
  clearDetail()
  newCommentText.value = ''
  loadTasks({ silent: true }).catch(() => {})
}

function submitComment() {
  const tid = taskDetailId.value
  if (!tid || !newCommentText.value.trim()) return
  const text = newCommentText.value.trim()
  void promiseToast(
    (async () => {
      await addComment(tid, text)
      newCommentText.value = ''
    })(),
    {
      loading: 'Publicando comentario…',
      success: 'Comentario publicado',
      errorFallback: 'No se pudo publicar el comentario.'
    }
  )
}

async function handleDeleteComment(commentId: string) {
  const tid = taskDetailId.value
  if (!tid || !confirm('¿Eliminar este comentario?')) return
  try {
    await deleteComment(tid, commentId)
  } catch (e) {
    showError(e, 'No se pudo eliminar el comentario.')
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
    showError(e, 'No se pudo procesar la solicitud.')
  }
}

async function removeMember(userId: string) {
  if (!confirm('¿Quitar a este miembro del tablero?')) return
  try {
    await apiFetch(`/api/boards/${props.boardId}/members/${userId}`, { method: 'DELETE' })
    await refreshMembers()
  } catch (e) {
    showError(e, 'No se pudo quitar al miembro.')
  }
}

function copyBoardId() {
  if (!import.meta.client || !navigator.clipboard) return
  navigator.clipboard
    .writeText(props.boardId)
    .then(() => {
      success('ID del tablero copiado')
      copyBoardFeedback.value = 'ID copiado'
      if (copyBoardTimer) clearTimeout(copyBoardTimer)
      copyBoardTimer = setTimeout(() => {
        copyBoardFeedback.value = ''
      }, 2500)
    })
    .catch(() => {
      showError('No se pudo copiar al portapapeles.')
    })
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

const assigneeQueryId = computed(() => {
  const q = route.query.assignee
  return typeof q === 'string' ? q : ''
})

const assigneesOnBoard = computed<TaskAssignee[]>(() => {
  const map = new Map<string, TaskAssignee>()
  for (const t of tasks.value) {
    for (const a of t.assignees ?? []) {
      if (!map.has(a.user_id)) map.set(a.user_id, a)
    }
  }
  return [...map.values()].sort((a, b) =>
    userLabel(a).localeCompare(userLabel(b), undefined, { sensitivity: 'base' })
  )
})

function setAssigneeQuery(id: string) {
  const q = { ...route.query } as Record<string, string | string[] | undefined>
  if (!id) delete q.assignee
  else q.assignee = id
  router.replace({ path: route.path, query: q })
}

watch(
  [assigneesOnBoard, () => route.query.assignee],
  () => {
    const id = typeof route.query.assignee === 'string' ? route.query.assignee : ''
    if (!id) return
    if (!assigneesOnBoard.value.some((a) => a.user_id === id)) {
      const q = { ...route.query } as Record<string, string | string[] | undefined>
      delete q.assignee
      router.replace({ path: route.path, query: q })
    }
  },
  { flush: 'post' }
)

const visibleTasks = computed(() => {
  const id = assigneeQueryId.value
  if (!id) return tasks.value
  return tasks.value.filter((t) => (t.assignees ?? []).some((a) => a.user_id === id))
})

// Objeto reactivo para triggers de agregar tarea por columna

// Computed para mapear tareas por columna de forma reactiva (usando objeto para reactividad)
const tasksByColumn = computed(() => {
  const tasksArray = visibleTasks.value
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

const deleteColumnTaskCount = computed(() => {
  const pending = pendingDeleteColumn.value
  if (!pending) return 0
  return (tasksByColumn.value[pending.id] || []).length
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
    showError(err, 'No se pudo crear la columna.')
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

watch(showDeleteColumnModal, (show) => {
  if (show) {
    nextTick(() => {
      deleteColumnDialogRef.value?.focus()
    })
  }
})

watch(showDeleteTaskModal, (show) => {
  if (show) {
    nextTick(() => {
      deleteTaskDialogRef.value?.focus()
    })
  }
})

function openDeleteColumnConfirm(columnId: string) {
  const col = localColumns.value.find((c) => c.id === columnId)
  if (!col) return
  pendingDeleteColumn.value = { id: col.id, title: col.title }
  showDeleteColumnModal.value = true
}

function cancelDeleteColumn() {
  pendingDeleteColumn.value = null
  showDeleteColumnModal.value = false
}

async function confirmDeleteColumn() {
  const id = pendingDeleteColumn.value?.id
  if (!id) return
  cancelDeleteColumn()
  await handleColumnDelete(id)
}

function openDeleteTaskConfirm(taskId: string) {
  let title = tasks.value.find((t) => t.id === taskId)?.title
  if (!title && taskDetailId.value === taskId && taskDetail.value) {
    title = taskDetail.value.task.title
  }
  pendingDeleteTask.value = { id: taskId, title: title?.trim() || 'esta tarea' }
  showDeleteTaskModal.value = true
}

function cancelDeleteTask() {
  pendingDeleteTask.value = null
  showDeleteTaskModal.value = false
}

async function confirmDeleteTask() {
  const id = pendingDeleteTask.value?.id
  if (!id) return
  cancelDeleteTask()
  await handleTaskDelete(id)
  if (taskDetailId.value === id) {
    closeTaskDetail()
  }
}

async function handleColumnDelete(columnId: string) {
  try {
    await removeColumn(columnId)
    // Recargar columnas para asegurar sincronización
    await loadColumns()
  } catch (err) {
    showError(err, 'No se pudo eliminar la columna.')
  }
}

async function handleColumnUpdate(columnId: string, title: string) {
  if (!title.trim() || title.trim().length < 3) {
    warning('El nombre de la columna debe tener al menos 3 caracteres.')
    return
  }
  try {
    await updateColumn(columnId, title)
    // Recargar columnas para sincronizar
    await loadColumns()
  } catch (err) {
    showError(err, 'No se pudo actualizar la columna.')
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
    await loadTasks({ silent: true })
    throw err
  }
}

async function saveTaskDetailMeta() {
  const createColId = taskDetailCreateColumnId.value
  const title = taskEditTitle.value.trim()
  if (title.length < 3) {
    warning('El título debe tener al menos 3 caracteres.')
    return
  }
  if (createColId) {
    void promiseToast(
      (async () => {
        const newTask = await createTask(createColId, title, taskEditColor.value)
        const descriptionNorm = normalizeTaskDescription(taskEditDescription.value)
        if (descriptionNorm.length > 0) {
          await updateTask(newTask.id, { description: descriptionNorm })
        }
        taskDetailCreateColumnId.value = null
        taskDetailId.value = newTask.id
        taskDetailMetaEditing.value = false
        await loadDetail(newTask.id)
        await loadTasks({ silent: true })
        return newTask
      })(),
      {
        loading: 'Creando tarea…',
        success: 'Tarea creada',
        errorFallback: 'No se pudo crear la tarea.'
      }
    )
    return
  }

  const tid = taskDetailId.value
  if (!tid || !taskDetail.value) return
  const bid = props.boardId
  void promiseToast(
    (async () => {
      const descriptionNorm = normalizeTaskDescription(taskEditDescription.value)
      await handleTaskUpdate(tid, {
        title,
        color: taskEditColor.value,
        description: descriptionNorm.length ? descriptionNorm : null
      })
      const baseline = taskMetaAssigneesBaseline.value
      const desired = [...taskEditAssigneeIds.value]
      const baselineSet = new Set(baseline)
      const toAdd = desired.filter((id) => !baselineSet.has(id))
      const toRemove = baseline.filter((id) => !desired.includes(id))
      try {
        if (bid) {
          for (const id of toAdd) {
            await apiFetch(`/api/boards/${bid}/tasks/${tid}/assignees`, {
              method: 'POST',
              body: { user_id: id }
            })
          }
          for (const id of toRemove) {
            await apiFetch(`/api/boards/${bid}/tasks/${tid}/assignees/${id}`, { method: 'DELETE' })
          }
        }
        taskMetaAssigneesBaseline.value = [...desired]
        await loadDetail(tid)
        await loadTasks({ silent: true })
        taskDetailMetaEditing.value = false
      } catch (e) {
        await loadDetail(tid).catch(() => {})
        await loadTasks({ silent: true })
        throw e
      }
    })(),
    {
      loading: 'Guardando cambios…',
      success: 'Cambios guardados',
      errorFallback: 'No se pudieron guardar los cambios.'
    }
  )
}

async function handleTaskDelete(taskId: string) {
  try {
    await removeTask(taskId)
    await loadTasks({ silent: true })
  } catch (err) {
    showError(err, 'No se pudo eliminar la tarea.')
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
    showError(err, 'No se pudo mover la tarea.')
    await loadTasks({ silent: true })
  }
}

async function handleTaskReorder(columnId: string, updates: Array<{ id: string; order: number }>) {
  try {
    await reorderTasks(updates)
    await loadTasks({ silent: true })
  } catch (err) {
    showError(err, 'No se pudieron reordenar las tareas.')
    await loadTasks({ silent: true })
  }
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
  margin-bottom: 10px;
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
  max-height: 600.9px;
  width: 100%;
  overflow: hidden;
  min-height: 0;
}

.board__task-detail-modal-body {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1 1 auto;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 32px;
}

.board__task-detail-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
  flex-wrap: wrap;
}

.board__task-detail-topbar-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-shrink: 0;
  margin-left: auto;
}

.board__task-detail-meta--topbar {
  margin: 0;
  flex: 1;
  min-width: 140px;
}

.board__task-detail-close-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: #fff;
  background: var(--brand-primary);
  border: 1px solid var(--brand-primary);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition:
    background-color var(--transition-base),
    border-color var(--transition-base),
    box-shadow var(--transition-base);
}

.board__task-detail-close-btn:hover {
  background: var(--brand-primary-hover);
  border-color: var(--brand-primary-hover);
  box-shadow: var(--shadow-sm);
}

.board__task-detail-close-btn:active {
  background: var(--brand-primary-active);
  border-color: var(--brand-primary-active);
}

.board__task-detail-close-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  box-shadow: none;
}

.board__task-detail-close-btn:disabled:hover,
.board__task-detail-close-btn:disabled:active {
  background: var(--brand-primary);
  border-color: var(--brand-primary);
  box-shadow: none;
}

.board__task-detail-error-body {
  margin: 0;
}

.board__task-detail-section--title-block {
  margin-bottom: var(--spacing-md);
}

.board__task-detail-title-readonly-row {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
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

.board__task-detail-hint {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-sm);
  line-height: var(--line-height-relaxed);
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

.board__task-detail-edit-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  flex-shrink: 0;
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--brand-primary);
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition:
    background-color var(--transition-base),
    border-color var(--transition-base);
}

.board__task-detail-edit-btn:hover {
  background: var(--bg-tertiary);
  border-color: var(--brand-primary);
}

.board__task-detail-edit-icon {
  width: 1.125rem;
  height: 1.125rem;
}

.board__task-detail-delete-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  padding: 0;
  color: var(--text-secondary);
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition:
    background-color var(--transition-base),
    border-color var(--transition-base),
    color var(--transition-base);
}

.board__task-detail-delete-btn:hover {
  color: #b71c1c;
  border-color: rgba(183, 28, 28, 0.45);
  background: rgba(183, 28, 28, 0.06);
}

.board__task-detail-delete-icon {
  width: 1.125rem;
  height: 1.125rem;
}

.board__task-detail-readonly-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  line-height: var(--line-height-tight);
  margin: 0;
  word-break: break-word;
  flex: 1;
  min-width: 0;
}

.board__task-detail-readonly-swatch {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 2px solid var(--border-color);
  box-sizing: border-box;
  margin-top: 2px;
}

.board__task-detail-assignees-toolbar {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-wrap: nowrap;
  min-width: 0;
  margin-bottom: var(--spacing-sm);
}

.board__task-detail-assignees-label {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  white-space: nowrap;
  flex-shrink: 0;
}

.board__task-detail-assignee-strip {
  display: flex;
  align-items: center;
  gap: 0;
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  padding: 5px 8px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.board__task-detail-assignee-strip::-webkit-scrollbar {
  display: none;
}

.board__task-detail-assignee-chip-pad {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 6px;
  margin: 0;
  line-height: 0;
}

.board__task-detail-assignee-chip-pad--with-remove {
  position: relative;
  padding-right: 10px;
}

.board__task-detail-assignee-none-inner {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  box-sizing: border-box;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  transition:
    box-shadow var(--transition-base),
    transform var(--transition-fast);
}

.board__task-detail-assignee-chip-pad--active .board__task-detail-assignee-none-inner {
  box-shadow: 0 0 0 2px var(--brand-primary);
}

.board__task-detail-assignee-user-icon {
  width: 18px;
  height: 18px;
}

.board__task-detail-assignee-avatar-inner {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  box-sizing: border-box;
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  color: #fff;
  letter-spacing: -0.02em;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.12);
}

.board__task-detail-assignee-avatar-inner--picker {
  box-shadow: 0 0 0 2px dashed var(--border-color);
}

.board__task-detail-assignee-picker-btn {
  margin: 0;
  padding: 6px;
  border: none;
  background: transparent;
  cursor: pointer;
  line-height: 0;
  border-radius: 50%;
  flex-shrink: 0;
  transition: transform var(--transition-base);
}

.board__task-detail-assignee-picker-btn:hover {
  transform: scale(1.06);
}

.board__task-detail-assignee-picker-btn:focus-visible {
  outline: 2px solid var(--brand-primary);
  outline-offset: 2px;
}

.board__task-detail-assignee-remove {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 18px;
  height: 18px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: var(--bg-secondary);
  color: var(--text-tertiary);
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 0 1px var(--border-color);
  transition: color var(--transition-fast), background var(--transition-fast);
}

.board__task-detail-assignee-remove:hover {
  color: #d32f2f;
  background: var(--bg-tertiary);
}

.board__task-detail-assignee-remove:focus-visible {
  outline: 2px solid var(--brand-primary);
  outline-offset: 2px;
}

.board__task-detail-description-view {
  padding: var(--spacing-sm);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-color);
  background: var(--bg-tertiary);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-relaxed);
  max-height: 280px;
  overflow-y: auto;
}

.board__task-detail-description-view :deep(.markdown-body p) {
  margin: 0 0 0.5em;
}

.board__task-detail-description-view :deep(.markdown-body p:last-child) {
  margin-bottom: 0;
}

.board__task-detail-description-view :deep(.markdown-body ul),
.board__task-detail-description-view :deep(.markdown-body ol) {
  margin: 0.25em 0 0.5em;
  padding-left: 1.25rem;
}

.board__task-detail-description-view :deep(.markdown-body a) {
  color: var(--brand-primary);
  word-break: break-all;
}

.board__task-detail-description-view :deep(.markdown-body code) {
  font-family: ui-monospace, monospace;
  font-size: 0.9em;
  background: rgba(0, 0, 0, 0.06);
  padding: 0.1em 0.35em;
  border-radius: 4px;
}

.board__task-detail-description-view :deep(.markdown-body pre) {
  overflow-x: auto;
  padding: var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  background: rgba(0, 0, 0, 0.06);
}

.board__task-detail-description-view :deep(.markdown-body blockquote) {
  margin: 0.5em 0;
  padding-left: var(--spacing-sm);
  border-left: 3px solid var(--border-color);
  color: var(--text-secondary);
}

.board__task-detail-desc-empty {
  margin-top: 0;
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

.board__add-column-form.board__modal--task-detail {
  padding: 0;
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

  .board__add-column-form.board__modal--task-detail {
    padding: 0;
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

.board__form-button.board__form-button--danger {
  background: #dc2626;
  color: #fff;
  border: none;
}

.board__form-button.board__form-button--danger:hover:not(:disabled) {
  background: #b91c1c;
  box-shadow: var(--shadow-sm);
}

.board__form-button.board__form-button--danger:active:not(:disabled) {
  transform: scale(0.98);
}

.board__modal-warning-text {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: var(--line-height-relaxed);
}

.board__modal-warning-text strong {
  color: var(--text-primary);
}

.board__modal-warning-meta {
  margin: 0;
  font-size: var(--font-size-sm);
  color: #d32f2f;
  font-weight: var(--font-weight-medium);
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
