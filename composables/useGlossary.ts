import { ref, computed, type Ref, type ComputedRef, unref } from 'vue'
import type { GlossaryItem } from '~/utils/types'
import { apiFetch } from '~/composables/useApi'

export function useGlossary(boardId: Ref<string | null> | ComputedRef<string | null> | (() => string | null)) {
  const glossaryItems = ref<GlossaryItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const getBoardId = () => {
    if (typeof boardId === 'function') return boardId()
    return unref(boardId)
  }

  const base = () => {
    const id = getBoardId()
    if (!id) throw new Error('No hay boardId')
    return `/api/boards/${id}/glossary`
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
      glossaryItems.value = await apiFetch<GlossaryItem[]>(base())
    } catch (err) {
      error.value = 'Error al cargar el glosario'
      throw err
    } finally {
      loading.value = false
    }
  }

  const create = async (name: string, color: string) => {
    loading.value = true
    error.value = null
    try {
      const newItem = await apiFetch<GlossaryItem>(base(), {
        method: 'POST',
        body: { name, color }
      })
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
      await apiFetch(`${base()}/${itemId}`, { method: 'DELETE' })
      glossaryItems.value = glossaryItems.value.filter((item) => item.id !== itemId)
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
      await apiFetch(`${base()}/${itemId}`, {
        method: 'PATCH',
        body: { name, color }
      })
      const item = glossaryItems.value.find((i) => i.id === itemId)
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
      await apiFetch(`${base()}/reorder`, {
        method: 'POST',
        body: { updates: newOrder }
      })
      newOrder.forEach(({ id, order }) => {
        const item = glossaryItems.value.find((i) => i.id === id)
        if (item) {
          item.order = order
        }
      })
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
