<template>
  <div class="page">
    <LoginGate
      v-if="!isAuthenticated && !isLoading"
      @authenticated="handleAuthenticated"
    />
    <Board
      v-else-if="isAuthenticated && boardLoaded"
    />
    <div v-else class="page__loading">
      <p>Cargando...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import LoginGate from '~/components/LoginGate.vue'
import Board from '~/components/Board.vue'
import { useAuth } from '~/composables/useAuth'
import { useBoard } from '~/composables/useBoard'

const { isAuthenticated: checkAuth } = useAuth()
const { loadBoard } = useBoard()

const isAuthenticated = ref(false)
const boardLoaded = ref(false)
const isLoading = ref(true)

onMounted(async () => {
  try {
    // Verificar autenticación
    isAuthenticated.value = checkAuth()
    if (isAuthenticated.value) {
      await initializeBoard()
    }
  } catch (err) {
    isAuthenticated.value = false
  } finally {
    isLoading.value = false
  }
})

function handleAuthenticated() {
  isAuthenticated.value = true
  initializeBoard()
}

async function initializeBoard() {
  try {
    await loadBoard()
    boardLoaded.value = true
  } catch (err) {
    // Si no hay board, el LoginGate se encargará de crearlo al registrarse
    isAuthenticated.value = false
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
}

.page__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  color: var(--text-secondary);
}
</style>
