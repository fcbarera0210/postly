import { ref, type Ref } from 'vue'
import { apiFetch } from '~/composables/useApi'
import type { TaskDetail } from '~/utils/types'

export function useTaskDetail(boardId: Ref<string | null | undefined>) {
  const detail = ref<TaskDetail | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadDetail(taskId: string) {
    const bid = boardId.value
    if (!bid) return
    loading.value = true
    error.value = null
    try {
      detail.value = await apiFetch<TaskDetail>(`/api/boards/${bid}/tasks/${taskId}`)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error al cargar la tarea'
      detail.value = null
    } finally {
      loading.value = false
    }
  }

  function clearDetail() {
    detail.value = null
    error.value = null
  }

  async function addComment(taskId: string, body: string) {
    const bid = boardId.value
    if (!bid) return
    await apiFetch(`/api/boards/${bid}/tasks/${taskId}/comments`, {
      method: 'POST',
      body: { body }
    })
    await loadDetail(taskId)
  }

  async function deleteComment(taskId: string, commentId: string) {
    const bid = boardId.value
    if (!bid) return
    await apiFetch(`/api/boards/${bid}/tasks/${taskId}/comments/${commentId}`, {
      method: 'DELETE'
    })
    await loadDetail(taskId)
  }

  async function addAssignee(taskId: string, userId: string) {
    const bid = boardId.value
    if (!bid) return
    await apiFetch(`/api/boards/${bid}/tasks/${taskId}/assignees`, {
      method: 'POST',
      body: { user_id: userId }
    })
    await loadDetail(taskId)
  }

  async function removeAssignee(taskId: string, userId: string) {
    const bid = boardId.value
    if (!bid) return
    await apiFetch(`/api/boards/${bid}/tasks/${taskId}/assignees/${userId}`, {
      method: 'DELETE'
    })
    await loadDetail(taskId)
  }

  return {
    detail,
    loading,
    error,
    loadDetail,
    clearDetail,
    addComment,
    deleteComment,
    addAssignee,
    removeAssignee
  }
}
