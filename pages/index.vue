<template>
  <div class="page">
    <div v-if="redirecting" class="page__loading">
      <p>Cargando...</p>
    </div>
    <LoginGate v-else @authenticated="goBoards" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import LoginGate from '~/components/LoginGate.vue'
import { useAuth } from '~/composables/useAuth'

const { isAuthenticated: checkAuth } = useAuth()
const redirecting = ref(true)

function goBoards() {
  navigateTo('/boards')
}

onMounted(() => {
  if (import.meta.client && checkAuth()) {
    navigateTo('/boards')
    return
  }
  redirecting.value = false
})
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
