<template>
  <Board v-if="boardId" :board-id="boardId" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Board from '~/components/Board.vue'

definePageMeta({
  middleware: 'auth'
})

const route = useRoute()
const boardId = computed(() => route.params.id as string)
</script>
