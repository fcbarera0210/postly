import { ref, computed, type Ref, type ComputedRef, unref } from 'vue'
import type { Task } from '~/utils/db'
import { getTasksByBoard, createTask, updateTask, deleteTask, moveTask, reorderTasks } from '~/utils/db'
import { nanoid } from 'nanoid'

const tasks = ref<Task[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

export function useTasks(boardId: Ref<string | null> | ComputedRef<string | null> | (() => string | null)) {
  const getBoardId = () => {
    if (typeof boardId === 'function') return boardId()
    return unref(boardId)
  }

  const loadTasks = async () => {
    const id = getBoardId()
    if (!id) {
      tasks.value = []
      return
    }

    loading.value = true
    error.value = null
    try {
      tasks.value = await getTasksByBoard(id)
    } catch (err) {
      error.value = 'Error al cargar las tareas'
      throw err
    } finally {
      loading.value = false
    }
  }

  const getTasksByColumn = (columnId: string) => {
    return computed(() => 
      tasks.value
        .filter(t => t.column_id === columnId)
        .sort((a, b) => a.order - b.order)
    )
  }

  const create = async (columnId: string, title: string, color: string | null = null) => {
    loading.value = true
    error.value = null
    try {
      // Obtener el máximo order de las tareas en esta columna
      const columnTasks = tasks.value.filter(t => t.column_id === columnId)
      const maxOrder = columnTasks.length > 0 
        ? Math.max(...columnTasks.map(t => t.order)) 
        : -1
      const newOrder = maxOrder + 1

      const newTask = await createTask(nanoid(), columnId, title, color, newOrder)
      tasks.value.push(newTask)
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
      await deleteTask(taskId)
      tasks.value = tasks.value.filter(t => t.id !== taskId)
    } catch (err) {
      error.value = 'Error al eliminar la tarea'
      throw err
    } finally {
      loading.value = false
    }
  }

  const update = async (taskId: string, updates: { title?: string; color?: string | null }) => {
    loading.value = true
    error.value = null
    try {
      await updateTask(taskId, updates.title, updates.color)
      const task = tasks.value.find(t => t.id === taskId)
      if (task) {
        if (updates.title !== undefined) task.title = updates.title
        if (updates.color !== undefined) task.color = updates.color
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
      await moveTask(taskId, newColumnId, newOrder)
      const task = tasks.value.find(t => t.id === taskId)
      if (task) {
        task.column_id = newColumnId
        task.order = newOrder
      }
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
      await reorderTasks(updates)
      // Actualizar orden local
      updates.forEach(({ id, order }) => {
        const task = tasks.value.find(t => t.id === id)
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
