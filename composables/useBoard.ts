import { ref, computed } from 'vue'
import type { Board } from '~/utils/db'
import { getBoard, updateBoardName, createBoard as createBoardDb } from '~/utils/db'
import { useAuth } from '~/composables/useAuth'
import { nanoid } from 'nanoid'

const board = ref<Board | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

export function useBoard() {
  const { getCurrentUser } = useAuth()

  const loadBoard = async () => {
    loading.value = true
    error.value = null
    try {
      const user = await getCurrentUser()
      if (!user) {
        throw new Error('Usuario no autenticado')
      }

      board.value = await getBoard(user.id)
      return board.value
    } catch (err) {
      error.value = 'Error al cargar el tablero'
      throw err
    } finally {
      loading.value = false
    }
  }

  const initializeBoard = async (name: string) => {
    loading.value = true
    error.value = null
    try {
      const user = await getCurrentUser()
      if (!user) {
        throw new Error('Usuario no autenticado')
      }

      const existingBoard = await getBoard(user.id)
      if (existingBoard) {
        throw new Error('El tablero ya existe')
      }

      const boardId = nanoid()
      board.value = await createBoardDb(boardId, name, user.id)
      return board.value
    } catch (err) {
      error.value = 'Error al crear el tablero'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateName = async (newName: string) => {
    if (!board.value) {
      throw new Error('No hay tablero cargado')
    }

    loading.value = true
    error.value = null
    try {
      await updateBoardName(board.value.id, newName)
      board.value.name = newName
    } catch (err) {
      error.value = 'Error al actualizar el nombre'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    board: computed(() => board.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    loadBoard,
    initializeBoard,
    updateName
  }
}
