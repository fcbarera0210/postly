import { ref, computed, watch, unref, type Ref, type ComputedRef } from 'vue'
import type { Board } from '~/utils/types'
import { apiFetch } from '~/composables/useApi'

export function useBoard(
  boardId: Ref<string | null | undefined> | ComputedRef<string | null | undefined> | (() => string | null | undefined)
) {
  const board = ref<Board | null>(null)
  const boardRole = ref<'owner' | 'editor' | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const getId = () => {
    if (typeof boardId === 'function') return boardId() ?? null
    return unref(boardId) ?? null
  }

  const loadBoard = async () => {
    const id = getId()
    if (!id) {
      board.value = null
      boardRole.value = null
      return null
    }

    loading.value = true
    error.value = null
    try {
      const b = await apiFetch<Board & { role?: 'owner' | 'editor' }>(`/api/boards/${id}`)
      board.value = { id: b.id, name: b.name, created_at: b.created_at, role: b.role }
      boardRole.value = b.role ?? null
      return board.value
    } catch (err) {
      error.value = 'Error al cargar el tablero'
      throw err
    } finally {
      loading.value = false
    }
  }

  watch(
    () => getId(),
    (id) => {
      if (id) {
        loadBoard().catch(() => {})
      } else {
        board.value = null
        boardRole.value = null
      }
    },
    { immediate: true }
  )

  const updateName = async (newName: string) => {
    const id = getId()
    if (!id || !board.value) {
      throw new Error('No hay tablero cargado')
    }

    loading.value = true
    error.value = null
    try {
      const b = await apiFetch<Board>(`/api/boards/${id}`, {
        method: 'PATCH',
        body: { name: newName }
      })
      board.value.name = b.name
    } catch (err) {
      error.value = 'Error al actualizar el nombre'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    board: computed(() => board.value),
    boardRole: computed(() => boardRole.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    loadBoard,
    updateName
  }
}
