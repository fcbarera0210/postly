import { ref, computed, type Ref, type ComputedRef, unref } from 'vue'
import type { Task } from '~/utils/types'
import { apiFetch } from '~/composables/useApi'

export function useTasks(boardId: Ref<string | null> | ComputedRef<string | null> | (() => string | null)) {
  const tasks = ref<Task[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const getBoardId = () => {
    if (typeof boardId === 'function') return boardId()
    return unref(boardId)
  }

  const base = () => {
    const id = getBoardId()
    if (!id) throw new Error('No hay boardId')
    return `/api/boards/${id}/tasks`
  }

  const loadTasks = async (opts?: { silent?: boolean }) => {
    const id = getBoardId()
    if (!id) {
      tasks.value = []
      return
    }

    const silent = opts?.silent === true
    if (!silent) loading.value = true
    error.value = null
    try {
      tasks.value = await apiFetch<Task[]>(base())
    } catch (err) {
      error.value = 'Error al cargar las tareas'
      throw err
    } finally {
      if (!silent) loading.value = false
    }
  }

  const getTasksByColumn = (columnId: string) => {
    return computed(() =>
      tasks.value.filter((t) => t.column_id === columnId).sort((a, b) => a.order - b.order)
    )
  }

  const create = async (columnId: string, title: string, color: string | null = null) => {
    loading.value = true
    error.value = null
    try {
      const newTask = await apiFetch<Task>(base(), {
        method: 'POST',
        body: { columnId, title, color }
      })
      await loadTasks()
      return newTask
    } catch (err) {
      error.value = 'Error al crear la tarea'
      throw err
    } finally {
      loading.value = false
    }
  }

  const remove = async (taskId: string) => {
    loading.value = true
    error.value = null
    try {
      await apiFetch(`${base()}/${taskId}`, { method: 'DELETE' })
      tasks.value = tasks.value.filter((t) => t.id !== taskId)
    } catch (err) {
      error.value = 'Error al eliminar la tarea'
      throw err
    } finally {
      loading.value = false
    }
  }

  const update = async (
    taskId: string,
    updates: { title?: string; color?: string | null; description?: string | null }
  ) => {
    loading.value = true
    error.value = null
    try {
      await apiFetch(`${base()}/${taskId}`, {
        method: 'PATCH',
        body: updates
      })
      const task = tasks.value.find((t) => t.id === taskId)
      if (task) {
        if (updates.title !== undefined) task.title = updates.title
        if (updates.color !== undefined) task.color = updates.color
        if (updates.description !== undefined) task.description = updates.description
      }
    } catch (err) {
      error.value = 'Error al actualizar la tarea'
      throw err
    } finally {
      loading.value = false
    }
  }

  const move = async (taskId: string, newColumnId: string, newOrder: number) => {
    loading.value = true
    error.value = null
    try {
      await apiFetch(`${base()}/move`, {
        method: 'POST',
        body: { taskId, newColumnId, newOrder }
      })
      const task = tasks.value.find((t) => t.id === taskId)
      if (task) {
        task.column_id = newColumnId
        task.order = newOrder
      }
      loadTasks({ silent: true }).catch(() => {})
    } catch (err) {
      error.value = 'Error al mover la tarea'
      throw err
    } finally {
      loading.value = false
    }
  }

  const reorder = async (updates: Array<{ id: string; order: number }>) => {
    loading.value = true
    error.value = null
    try {
      await apiFetch(`${base()}/reorder`, {
        method: 'POST',
        body: { updates }
      })
      updates.forEach(({ id, order }) => {
        const task = tasks.value.find((t) => t.id === id)
        if (task) {
          task.order = order
        }
      })
    } catch (err) {
      error.value = 'Error al reordenar las tareas'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    tasks: computed(() => tasks.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    loadTasks,
    getTasksByColumn,
    create,
    remove,
    update,
    move,
    reorder
  }
}
