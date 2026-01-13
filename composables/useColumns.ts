import { ref, computed, type Ref, type ComputedRef, unref } from 'vue'
import type { Column } from '~/utils/db'
import { getColumns, createColumn, updateColumn, deleteColumn, reorderColumns } from '~/utils/db'
import { nanoid } from 'nanoid'

const columns = ref<Column[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const MIN_COLUMNS = 3

export function useColumns(boardId: Ref<string | null> | ComputedRef<string | null> | (() => string | null)) {
  const getBoardId = () => {
    if (typeof boardId === 'function') return boardId()
    return unref(boardId)
  }

  const loadColumns = async () => {
    const id = getBoardId()
    if (!id) {
      columns.value = []
      return
    }

    loading.value = true
    error.value = null
    try {
      columns.value = await getColumns(id)
    } catch (err) {
      error.value = 'Error al cargar las columnas'
      throw err
    } finally {
      loading.value = false
    }
  }

  const create = async (title: string) => {
    const id = getBoardId()
    if (!id) {
      throw new Error('No hay boardId disponible')
    }

    loading.value = true
    error.value = null
    try {
      const maxOrder = columns.value.length > 0 
        ? Math.max(...columns.value.map(c => c.order)) 
        : -1
      const newOrder = maxOrder + 1
      
      const newColumn = await createColumn(nanoid(), id, title, newOrder)
      columns.value.push(newColumn)
      return newColumn
    } catch (err) {
      error.value = 'Error al crear la columna'
      throw err
    } finally {
      loading.value = false
    }
  }

  const remove = async (columnId: string) => {
    const currentCount = columns.value.length
    if (currentCount <= MIN_COLUMNS) {
      error.value = `Debe haber al menos ${MIN_COLUMNS} columnas`
      throw new Error(`Debe haber al menos ${MIN_COLUMNS} columnas`)
    }

    loading.value = true
    error.value = null
    try {
      await deleteColumn(columnId)
      columns.value = columns.value.filter(c => c.id !== columnId)
    } catch (err) {
      error.value = 'Error al eliminar la columna'
      throw err
    } finally {
      loading.value = false
    }
  }

  const update = async (columnId: string, title: string) => {
    loading.value = true
    error.value = null
    try {
      await updateColumn(columnId, title)
      const column = columns.value.find(c => c.id === columnId)
      if (column) {
        column.title = title
      }
    } catch (err) {
      error.value = 'Error al actualizar la columna'
      throw err
    } finally {
      loading.value = false
    }
  }

  const reorder = async (newOrder: Array<{ id: string; order: number }>) => {
    loading.value = true
    error.value = null
    try {
      await reorderColumns(newOrder)
      // Actualizar orden local
      newOrder.forEach(({ id, order }) => {
        const column = columns.value.find(c => c.id === id)
        if (column) {
          column.order = order
        }
      })
      // Reordenar array
      columns.value.sort((a, b) => a.order - b.order)
    } catch (err) {
      error.value = 'Error al reordenar las columnas'
      throw err
    } finally {
      loading.value = false
    }
  }

  const canDelete = computed(() => columns.value.length > MIN_COLUMNS)

  return {
    columns: computed(() => columns.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    canDelete,
    loadColumns,
    create,
    remove,
    update,
    reorder
  }
}
