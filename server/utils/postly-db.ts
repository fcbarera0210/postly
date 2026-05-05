import { nanoid } from 'nanoid'
import { query, queryOne } from './neon-query'

export interface UserRow {
  id: string
  email: string
  password_hash: string
  created_at: number
  display_name: string | null
}

export interface BoardRow {
  id: string
  name: string
  created_at: number
}

export interface BoardListRow extends BoardRow {
  role: string
}

function defaultDisplayNameFromEmail(email: string): string {
  const local = email.split('@')[0] || email
  return local.slice(0, 80)
}

export async function dbCreateUser(id: string, email: string, passwordHash: string): Promise<UserRow> {
  const createdAt = Date.now()
  const displayName = defaultDisplayNameFromEmail(email)
  await query(
    'INSERT INTO users (id, email, password_hash, created_at, display_name) VALUES ($1, $2, $3, $4, $5)',
    [id, email, passwordHash, createdAt, displayName]
  )
  return { id, email, password_hash: passwordHash, created_at: createdAt, display_name: displayName }
}

export async function dbUpdateUserDisplayName(userId: string, displayName: string | null): Promise<void> {
  await query('UPDATE users SET display_name = $1 WHERE id = $2', [displayName, userId])
}

export async function dbGetUserByEmail(email: string): Promise<UserRow | null> {
  return queryOne<UserRow>('SELECT * FROM users WHERE email = $1', [email])
}

export async function dbGetUserById(id: string): Promise<UserRow | null> {
  return queryOne<UserRow>('SELECT * FROM users WHERE id = $1', [id])
}

export async function dbBoardExists(boardId: string): Promise<boolean> {
  const row = await queryOne<{ n: string }>('SELECT 1 as n FROM boards WHERE id = $1', [boardId])
  return !!row
}

export async function dbGetMemberRole(boardId: string, userId: string): Promise<'owner' | 'editor' | null> {
  const row = await queryOne<{ role: string }>(
    'SELECT role FROM board_members WHERE board_id = $1 AND user_id = $2',
    [boardId, userId]
  )
  if (!row) return null
  return row.role as 'owner' | 'editor'
}

export async function dbListBoardsForUser(userId: string): Promise<BoardListRow[]> {
  return query<BoardListRow>(
    `SELECT b.id, b.name, b.created_at, m.role
     FROM boards b
     INNER JOIN board_members m ON m.board_id = b.id
     WHERE m.user_id = $1
     ORDER BY b.created_at DESC`,
    [userId]
  )
}

export async function dbGetBoard(boardId: string): Promise<BoardRow | null> {
  return queryOne<BoardRow>('SELECT id, name, created_at FROM boards WHERE id = $1', [boardId])
}

export async function dbCreateBoardWithColumns(
  userId: string,
  name: string,
  initialColumnTitles?: string[]
): Promise<BoardRow> {
  const boardId = nanoid()
  const now = Date.now()
  await query('INSERT INTO boards (id, name, created_at) VALUES ($1, $2, $3)', [boardId, name, now])
  await query('INSERT INTO board_members (board_id, user_id, role) VALUES ($1, $2, $3)', [
    boardId,
    userId,
    'owner'
  ])
  const titles = initialColumnTitles?.length ? initialColumnTitles : ['Por hacer', 'En progreso', 'Hecho']
  for (let i = 0; i < titles.length; i++) {
    const colId = nanoid()
    await query('INSERT INTO columns (id, board_id, title, "order") VALUES ($1, $2, $3, $4)', [
      colId,
      boardId,
      titles[i],
      i
    ])
  }
  return { id: boardId, name, created_at: now }
}

export async function dbUpdateBoardName(boardId: string, name: string): Promise<void> {
  await query('UPDATE boards SET name = $1 WHERE id = $2', [name, boardId])
}

export async function dbListMembers(
  boardId: string
): Promise<Array<{ user_id: string; role: string; email: string; display_name: string | null }>> {
  return query(
    `SELECT m.user_id, m.role, u.email, u.display_name
     FROM board_members m
     INNER JOIN users u ON u.id = m.user_id
     WHERE m.board_id = $1
     ORDER BY m.role DESC, COALESCE(NULLIF(TRIM(u.display_name), ''), u.email) ASC`,
    [boardId]
  )
}

export async function dbRemoveMember(boardId: string, targetUserId: string): Promise<void> {
  await query('DELETE FROM board_members WHERE board_id = $1 AND user_id = $2 AND role = $3', [
    boardId,
    targetUserId,
    'editor'
  ])
}

export async function dbUpsertJoinRequest(boardId: string, requesterId: string): Promise<void> {
  const id = nanoid()
  const now = Date.now()
  await query(
    `INSERT INTO board_access_requests (id, board_id, requester_id, status, created_at, updated_at)
     VALUES ($1, $2, $3, 'pending', $4, $4)
     ON CONFLICT (board_id, requester_id) DO UPDATE SET
       status = 'pending',
       updated_at = EXCLUDED.updated_at`,
    [id, boardId, requesterId, now]
  )
}

export async function dbListPendingRequests(
  boardId: string
): Promise<
  Array<{
    id: string
    requester_id: string
    email: string
    display_name: string | null
    created_at: number
  }>
> {
  return query(
    `SELECT r.id, r.requester_id, u.email, u.display_name, r.created_at
     FROM board_access_requests r
     INNER JOIN users u ON u.id = r.requester_id
     WHERE r.board_id = $1 AND r.status = 'pending'
     ORDER BY r.created_at ASC`,
    [boardId]
  )
}

export async function dbListRecentRequestResolutions(
  boardId: string,
  limit = 8
): Promise<
  Array<{
    id: string
    requester_id: string
    requester_email: string
    requester_display_name: string | null
    status: string
    resolved_at: number | null
    resolver_email: string | null
    resolver_display_name: string | null
  }>
> {
  return query(
    `SELECT r.id, r.requester_id,
            ru.email AS requester_email, ru.display_name AS requester_display_name,
            r.status, r.resolved_at,
            su.email AS resolver_email, su.display_name AS resolver_display_name
     FROM board_access_requests r
     INNER JOIN users ru ON ru.id = r.requester_id
     LEFT JOIN users su ON su.id = r.resolved_by_user_id
     WHERE r.board_id = $1 AND r.status != 'pending' AND r.resolved_at IS NOT NULL
     ORDER BY r.resolved_at DESC
     LIMIT $2`,
    [boardId, limit]
  )
}

export async function dbGetPendingRequest(
  requestId: string,
  boardId: string
): Promise<{ id: string; requester_id: string } | null> {
  return queryOne(
    `SELECT id, requester_id FROM board_access_requests
     WHERE id = $1 AND board_id = $2 AND status = 'pending'`,
    [requestId, boardId]
  )
}

export async function dbAcceptRequest(
  boardId: string,
  requestId: string,
  requesterId: string,
  resolverUserId: string
): Promise<void> {
  const now = Date.now()
  await query(
    `UPDATE board_access_requests SET status = 'accepted', updated_at = $1,
       resolved_by_user_id = $4, resolved_at = $1
     WHERE id = $2 AND board_id = $3`,
    [now, requestId, boardId, resolverUserId]
  )
  await query(
    `INSERT INTO board_members (board_id, user_id, role) VALUES ($1, $2, 'editor')
     ON CONFLICT (board_id, user_id) DO UPDATE SET role = EXCLUDED.role`,
    [boardId, requesterId]
  )
}

export async function dbRejectRequest(
  boardId: string,
  requestId: string,
  resolverUserId: string
): Promise<void> {
  const now = Date.now()
  await query(
    `UPDATE board_access_requests SET status = 'rejected', updated_at = $1,
       resolved_by_user_id = $3, resolved_at = $1
     WHERE id = $2 AND board_id = $4`,
    [now, requestId, resolverUserId, boardId]
  )
}

// Columns
export async function dbGetColumns(boardId: string) {
  return query<{ id: string; board_id: string; title: string; order: number }>(
    'SELECT * FROM columns WHERE board_id = $1 ORDER BY "order" ASC',
    [boardId]
  )
}

export async function dbCreateColumn(id: string, boardId: string, title: string, order: number) {
  await query('INSERT INTO columns (id, board_id, title, "order") VALUES ($1, $2, $3, $4)', [
    id,
    boardId,
    title,
    order
  ])
}

export async function dbUpdateColumn(id: string, title: string) {
  await query('UPDATE columns SET title = $1 WHERE id = $2', [title, id])
}

export async function dbDeleteColumn(id: string) {
  await query('DELETE FROM columns WHERE id = $1', [id])
}

export async function dbGetColumnCount(boardId: string): Promise<number> {
  const row = await queryOne<{ count: string }>(
    'SELECT COUNT(*)::text as count FROM columns WHERE board_id = $1',
    [boardId]
  )
  return row ? parseInt(row.count, 10) : 0
}

export async function dbReorderColumns(updates: Array<{ id: string; order: number }>) {
  for (const u of updates) {
    await query('UPDATE columns SET "order" = $1 WHERE id = $2', [u.order, u.id])
  }
}

// Tasks
function coerceMs(v: unknown): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string') {
    const n = parseInt(v, 10)
    return Number.isFinite(n) ? n : 0
  }
  if (typeof v === 'bigint') return Number(v)
  return 0
}

export async function dbGetTasksByBoard(boardId: string) {
  const rows = await query<{
    id: string
    column_id: string
    title: string
    color: string | null
    order: number
    created_at: unknown
  }>(
    `SELECT t.id, t.column_id, t.title, t.color, t."order", t.created_at FROM tasks t
     INNER JOIN columns c ON t.column_id = c.id
     WHERE c.board_id = $1
     ORDER BY c."order" ASC, t."order" ASC`,
    [boardId]
  )

  const tasks = rows.map((r) => ({
    id: r.id,
    column_id: r.column_id,
    title: r.title,
    color: r.color,
    order: r.order,
    created_at: coerceMs(r.created_at),
    assignees: [] as Array<{ user_id: string; email: string; display_name: string | null }>
  }))

  if (tasks.length === 0) return tasks

  const ids = tasks.map((t) => t.id)
  const ph = ids.map((_, i) => `$${i + 1}`).join(', ')
  const assignRows = await query<{
    task_id: string
    user_id: string
    email: string
    display_name: string | null
  }>(
    `SELECT ta.task_id, ta.user_id, u.email, u.display_name
     FROM task_assignees ta
     INNER JOIN users u ON u.id = ta.user_id
     WHERE ta.task_id IN (${ph})
     ORDER BY ta.task_id, u.email ASC`,
    ids
  )

  const byTask = new Map<string, Array<{ user_id: string; email: string; display_name: string | null }>>()
  for (const a of assignRows) {
    const cur = byTask.get(a.task_id) ?? []
    cur.push({
      user_id: a.user_id,
      email: a.email,
      display_name: a.display_name
    })
    byTask.set(a.task_id, cur)
  }

  return tasks.map((t) => ({
    ...t,
    assignees: byTask.get(t.id) ?? []
  }))
}

export async function dbCreateTask(
  id: string,
  columnId: string,
  title: string,
  color: string | null,
  order: number,
  createdAt: number
) {
  await query(
    'INSERT INTO tasks (id, column_id, title, color, "order", created_at) VALUES ($1, $2, $3, $4, $5, $6)',
    [id, columnId, title, color, order, createdAt]
  )
}

export async function dbUpdateTask(
  id: string,
  patch: { title?: string; color?: string | null; description?: string | null }
) {
  if (patch.title !== undefined) {
    await query('UPDATE tasks SET title = $1 WHERE id = $2', [patch.title, id])
  }
  if (patch.color !== undefined) {
    await query('UPDATE tasks SET color = $1 WHERE id = $2', [patch.color, id])
  }
  if (patch.description !== undefined) {
    await query('UPDATE tasks SET description = $1 WHERE id = $2', [patch.description, id])
  }
}

export async function dbDeleteTask(id: string) {
  await query('DELETE FROM tasks WHERE id = $1', [id])
}

export async function dbMoveTask(taskId: string, newColumnId: string, newOrder: number) {
  await query('UPDATE tasks SET column_id = $1, "order" = $2 WHERE id = $3', [newColumnId, newOrder, taskId])
}

export async function dbReorderTasks(updates: Array<{ id: string; order: number }>) {
  for (const u of updates) {
    await query('UPDATE tasks SET "order" = $1 WHERE id = $2', [u.order, u.id])
  }
}

export async function dbVerifyColumnBelongsToBoard(columnId: string, boardId: string): Promise<boolean> {
  const row = await queryOne<{ n: string }>(
    'SELECT 1 as n FROM columns WHERE id = $1 AND board_id = $2',
    [columnId, boardId]
  )
  return !!row
}

export async function dbVerifyTaskBelongsToBoard(taskId: string, boardId: string): Promise<boolean> {
  const row = await queryOne<{ n: string }>(
    `SELECT 1 as n FROM tasks t
     INNER JOIN columns c ON c.id = t.column_id
     WHERE t.id = $1 AND c.board_id = $2`,
    [taskId, boardId]
  )
  return !!row
}

export interface TaskCommentWithAuthor {
  id: string
  task_id: string
  author_id: string
  body: string
  created_at: number
  author_email: string
  author_display_name: string | null
}

export interface TaskAssigneeWithEmail {
  user_id: string
  email: string
  display_name: string | null
}

export interface TaskDetailPayload {
  task: {
    id: string
    column_id: string
    title: string
    color: string | null
    description: string | null
    order: number
    created_at: number
  }
  comments: TaskCommentWithAuthor[]
  assignees: TaskAssigneeWithEmail[]
}

export async function dbGetTaskDetail(taskId: string, boardId: string): Promise<TaskDetailPayload | null> {
  const task = await queryOne<{
    id: string
    column_id: string
    title: string
    color: string | null
    description: string | null
    order: number
    created_at: number
  }>(
    `SELECT t.id, t.column_id, t.title, t.color, t.description, t."order", t.created_at
     FROM tasks t
     INNER JOIN columns c ON c.id = t.column_id
     WHERE t.id = $1 AND c.board_id = $2`,
    [taskId, boardId]
  )
  if (!task) return null

  const comments = await query<TaskCommentWithAuthor>(
    `SELECT tc.id, tc.task_id, tc.author_id, tc.body, tc.created_at, u.email AS author_email,
            u.display_name AS author_display_name
     FROM task_comments tc
     INNER JOIN users u ON u.id = tc.author_id
     WHERE tc.task_id = $1
     ORDER BY tc.created_at ASC`,
    [taskId]
  )

  const assignees = await query<TaskAssigneeWithEmail>(
    `SELECT ta.user_id, u.email, u.display_name
     FROM task_assignees ta
     INNER JOIN users u ON u.id = ta.user_id
     WHERE ta.task_id = $1
     ORDER BY COALESCE(NULLIF(TRIM(u.display_name), ''), u.email) ASC`,
    [taskId]
  )

  return { task, comments, assignees }
}

export async function dbInsertTaskComment(
  id: string,
  taskId: string,
  authorId: string,
  body: string,
  createdAt: number
): Promise<void> {
  await query(
    'INSERT INTO task_comments (id, task_id, author_id, body, created_at) VALUES ($1, $2, $3, $4, $5)',
    [id, taskId, authorId, body, createdAt]
  )
}

export async function dbDeleteTaskCommentIfOwn(
  commentId: string,
  taskId: string,
  authorId: string
): Promise<boolean> {
  const row = await queryOne<{ id: string }>(
    'DELETE FROM task_comments WHERE id = $1 AND task_id = $2 AND author_id = $3 RETURNING id',
    [commentId, taskId, authorId]
  )
  return !!row
}

export async function dbIsBoardMember(boardId: string, userId: string): Promise<boolean> {
  const row = await queryOne<{ n: string }>(
    'SELECT 1 AS n FROM board_members WHERE board_id = $1 AND user_id = $2',
    [boardId, userId]
  )
  return !!row
}

export async function dbInsertTaskAssignee(taskId: string, assigneeUserId: string): Promise<void> {
  await query('INSERT INTO task_assignees (task_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [
    taskId,
    assigneeUserId
  ])
}

export async function dbDeleteTaskAssignee(taskId: string, assigneeUserId: string): Promise<void> {
  await query('DELETE FROM task_assignees WHERE task_id = $1 AND user_id = $2', [taskId, assigneeUserId])
}
