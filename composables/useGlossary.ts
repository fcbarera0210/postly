import { ref, computed, type Ref, type ComputedRef, unref } from 'vue'
import type { GlossaryItem } from '~/utils/db'
import { getGlossaryItems, createGlossaryItem, updateGlossaryItem, deleteGlossaryItem, reorderGlossaryItems } from '~/utils/db'
import { nanoid } from 'nanoid'

const glossaryItems = ref<GlossaryItem[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

export function useGlossary(boardId: Ref<string | null> | ComputedRef<string | null> | (() => string | null)) {
  const getBoardId = () => {
    if (typeof boardId === 'function') return boardId()
    return unref(boardId)
  }

  const loadGlossary = async () => {
    const id = getBoardId()
    if (!id) {
      glossaryItems.value = []
      return
    }

    loading.value = true
    error.value = null
    try {
      glossaryItems.value = await getGlossaryItems(id)
    } catch (err) {
      error.value = 'Error al cargar el glosario'
      throw err
    } finally {
      loading.value = false
    }
  }

  const create = async (name: string, color: string) => {
    const id = getBoardId()
    if (!id) {
      throw new Error('No hay boardId disponible')
    }

    loading.value = true
    error.value = null
    try {
      const maxOrder = glossaryItems.value.length > 0 
        ? Math.max(...glossaryItems.value.map(item => item.order)) 
        : -1
      const newOrder = maxOrder + 1
      
      const newItem = await createGlossaryItem(nanoid(), id, name, color, newOrder)
      glossaryItems.value.push(newItem)
      return newItem
    } catch (err) {
      error.value = 'Error al crear el elemento del glosario'
      throw err
    } finally {
      loading.value = false
    }
  }

  const remove = async (itemId: string) => {
    loading.value = true
    error.value = null
    try {
      await deleteGlossaryItem(itemId)
      glossaryItems.value = glossaryItems.value.filter(item => item.id !== itemId)
    } catch (err) {
      error.value = 'Error al eliminar el elemento del glosario'
      throw err
    } finally {
      loading.value = false
    }
  }

  const update = async (itemId: string, name?: string, color?: string) => {
    loading.value = true
    error.value = null
    try {
      await updateGlossaryItem(itemId, name, color)
      const item = glossaryItems.value.find(item => item.id === itemId)
      if (item) {
        if (name !== undefined) item.name = name
        if (color !== undefined) item.color = color
      }
    } catch (err) {
      error.value = 'Error al actualizar el elemento del glosario'
      throw err
    } finally {
      loading.value = false
    }
  }

  const reorder = async (newOrder: Array<{ id: string; order: number }>) => {
    loading.value = true
    error.value = null
    try {
      await reorderGlossaryItems(newOrder)
      // Actualizar orden local
      newOrder.forEach(({ id, order }) => {
        const item = glossaryItems.value.find(item => item.id === id)
        if (item) {
          item.order = order
        }
      })
      // Reordenar array
      glossaryItems.value.sort((a, b) => a.order - b.order)
    } catch (err) {
      error.value = 'Error al reordenar el glosario'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    glossaryItems: computed(() => glossaryItems.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    loadGlossary,
    create,
    remove,
    update,
    reorder
  }
}
