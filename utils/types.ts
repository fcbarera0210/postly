export interface User {
  id: string
  email: string
  display_name?: string | null
  /** Clave post-it o null = color de marca por defecto (variables.css). */
  accent_color?: string | null
}

/** Cuerpo parcial para PATCH /api/auth/me */
export interface UserProfilePatch {
  display_name?: string | null
  accent_color?: string | null
}

export interface Board {
  id: string
  name: string
  created_at: number
  role?: 'owner' | 'editor'
}

export interface BoardMemberRow {
  user_id: string
  role: string
  email: string
  display_name?: string | null
}

export interface AccessRequestRow {
  id: string
  requester_id: string
  email: string
  display_name?: string | null
  created_at: number
}

export interface AccessRequestResolutionRow {
  id: string
  requester_id: string
  requester_email: string
  requester_display_name: string | null
  status: string
  resolved_at: number | null
  resolver_email: string | null
  resolver_display_name: string | null
}

export interface BoardRequestsPayload {
  pending: AccessRequestRow[]
  history: AccessRequestResolutionRow[]
}

export interface Column {
  id: string
  board_id: string
  title: string
  order: number
}

export interface Task {
  id: string
  column_id: string
  title: string
  color: string | null
  /** Markdown opcional; suele venir solo en el detalle de la tarea */
  description?: string | null
  order: number
  created_at: number
  /** Presente en listados Kanban cuando la API los incluye */
  assignees?: TaskAssignee[]
}

export interface TaskComment {
  id: string
  task_id: string
  author_id: string
  body: string
  created_at: number
  author_email: string
  author_display_name?: string | null
}

export interface TaskAssignee {
  user_id: string
  email: string
  display_name?: string | null
}

export interface TaskDetail {
  task: Task
  comments: TaskComment[]
  assignees: TaskAssignee[]
}

/** Sentinela para el filtro de tareas sin responsables asignados. UUIDs no contienen `_`, no hay colisión. */
export const NO_ASSIGNEE_FILTER = '__none__'

