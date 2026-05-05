<template>
  <div class="assignee-filter" role="toolbar" aria-label="Filtrar tareas por responsable">
    <span id="assignee-filter-heading" class="assignee-filter__label">Responsable:</span>
    <div
      class="assignee-filter__list"
      role="radiogroup"
      aria-labelledby="assignee-filter-heading"
    >
      <button
        type="button"
        class="assignee-filter__chip"
        :class="{ 'assignee-filter__chip--active': !modelValue }"
        :aria-pressed="!modelValue"
        title="Todos los responsables"
        @click="emit('update:modelValue', '')"
      >
        <span class="assignee-filter__chip-inner assignee-filter__chip-inner--all">
          <Squares2X2Icon class="assignee-filter__all-icon" aria-hidden="true" />
        </span>
      </button>
      <button
        v-for="a in options"
        :key="a.user_id"
        type="button"
        class="assignee-filter__chip"
        :class="{ 'assignee-filter__chip--active': modelValue === a.user_id }"
        :aria-pressed="modelValue === a.user_id"
        :title="userLabel(a)"
        @click="emit('update:modelValue', a.user_id)"
      >
        <span
          class="assignee-filter__chip-inner assignee-filter__avatar"
          :style="{ backgroundColor: avatarBg(a.user_id) }"
        >
          {{ userInitials(a) }}
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Squares2X2Icon } from '@heroicons/vue/24/outline'
import type { TaskAssignee } from '~/utils/types'
import { userInitials, userLabel } from '~/utils/userLabel'

defineProps<{
  options: TaskAssignee[]
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function avatarBg(userId: string): string {
  let n = 0
  for (let i = 0; i < userId.length; i++) {
    n = (n + userId.charCodeAt(i) * (i + 3)) % 360
  }
  return `hsl(${n} 42% 38%)`
}
</script>

<style scoped>
.assignee-filter {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-bottom: 10px;
  flex-wrap: nowrap;
  min-width: 0;
}

.assignee-filter__label {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  white-space: nowrap;
  flex-shrink: 0;
}

.assignee-filter__list {
  display: flex;
  align-items: center;
  gap: 0;
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  /* Reserva espacio para anillo activo, sombra, hover scale y focus; sin esto el scrollport recorta arriba/abajo. */
  padding: 5px 8px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.assignee-filter__list::-webkit-scrollbar {
  display: none;
}

.assignee-filter__chip {
  flex-shrink: 0;
  /* El anillo (box-shadow) no cuenta en el layout; el padding evita que quede fuera de la caja del botón. */
  padding: 6px;
  margin: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 50%;
  line-height: 0;
}

.assignee-filter__chip:focus-visible {
  outline: 2px solid var(--brand-primary);
  outline-offset: 3px;
}

.assignee-filter__chip-inner {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  box-sizing: border-box;
  transition:
    box-shadow var(--transition-base),
    transform var(--transition-fast);
}

.assignee-filter__chip-inner--all {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
}

.assignee-filter__chip:hover .assignee-filter__chip-inner {
  transform: scale(1.05);
}

.assignee-filter__chip--active .assignee-filter__chip-inner {
  box-shadow: 0 0 0 2px var(--brand-primary);
}

.assignee-filter__all-icon {
  width: 18px;
  height: 18px;
}

.assignee-filter__avatar {
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  color: #fff;
  letter-spacing: -0.02em;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.12);
}

</style>
