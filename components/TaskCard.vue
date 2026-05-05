<template>
  <div
    class="task-card"
    :class="[`task-card--${colorClass}`]"
    :style="cardStyle"
    @click="handleCardClick"
  >
    <div class="task-card__content">
      <p
        class="task-card__title"
        :style="{ color: cardStyle.color }"
        @click.stop="$emit('open-detail')"
      >
        {{ task.title }}
      </p>
      <div class="task-card__footer">
        <div class="task-card__assignees" aria-label="Responsables">
          <span
            v-for="a in assigneesShown"
            :key="a.user_id"
            class="task-card__avatar"
            :style="{ backgroundColor: avatarBg(a.user_id) }"
            :title="userLabel(a)"
          >
            {{ userInitials(a) }}
          </span>
          <span
            v-if="assigneesExtra > 0"
            class="task-card__avatar task-card__avatar--more"
            :title="`${assigneesExtra} más`"
          >
            +{{ assigneesExtra }}
          </span>
        </div>
        <button
          type="button"
          class="task-card__detail-btn"
          title="Detalle, comentarios y responsables"
          aria-label="Abrir detalle de la tarea"
          @mousedown.stop
          @click.stop="$emit('open-detail')"
        >
          <ChatBubbleLeftRightIcon class="task-card__detail-icon" />
        </button>
      </div>
    </div>
    <button
      type="button"
      class="task-card__delete"
      title="Eliminar tarea"
      aria-label="Eliminar tarea"
      @click.stop="$emit('delete')"
    >
      <TrashIcon class="task-card__delete-icon" aria-hidden="true" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ChatBubbleLeftRightIcon, TrashIcon } from '@heroicons/vue/24/outline'
import type { Task, TaskAssignee } from '~/utils/types'
import { userInitials, userLabel } from '~/utils/userLabel'
import { postitBackgroundCss } from '~/utils/postitColors'

const MAX_AVATAR_CHIPS = 3

function avatarBg(userId: string): string {
  let n = 0
  for (let i = 0; i < userId.length; i++) {
    n = (n + userId.charCodeAt(i) * (i + 3)) % 360
  }
  return `hsl(${n} 42% 38%)`
}

const props = defineProps<{
  task: Task
}>()

const emit = defineEmits<{
  delete: []
  'open-detail': []
}>()

const assigneesList = computed(() => props.task.assignees ?? [])
const assigneesShown = computed<TaskAssignee[]>(() =>
  assigneesList.value.slice(0, MAX_AVATAR_CHIPS)
)
const assigneesExtra = computed(() =>
  Math.max(0, assigneesList.value.length - MAX_AVATAR_CHIPS)
)

function handleCardClick(e: MouseEvent) {
  const el = e.target as HTMLElement
  if (el.closest('.task-card__delete')) return
  if (el.closest('.task-card__title')) return
  emit('open-detail')
}

function getCSSVariableValue(variableName: string): string {
  if (typeof window === 'undefined') return '#ffffff'
  return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim()
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  hex = hex.replace('#', '')
  if (hex.length === 3) {
    hex = hex.split('').map((char) => char + char).join('')
  }
  if (hex.length !== 6) return null
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  return { r, g, b }
}

function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((val) => {
    val = val / 255
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

function getContrastColor(backgroundColor: string): string {
  if (!backgroundColor) return 'var(--text-primary)'

  let rgb: { r: number; g: number; b: number } | null = null

  if (backgroundColor.startsWith('var(')) {
    const varName = backgroundColor.match(/var\(([^)]+)\)/)?.[1]
    if (varName) {
      const cssValue = getCSSVariableValue(varName)
      if (cssValue.startsWith('#')) {
        rgb = hexToRgb(cssValue)
      } else if (cssValue.startsWith('rgb')) {
        const matches = cssValue.match(/\d+/g)
        if (matches && matches.length >= 3) {
          rgb = {
            r: parseInt(matches[0], 10),
            g: parseInt(matches[1], 10),
            b: parseInt(matches[2], 10)
          }
        }
      }
    }
  } else if (backgroundColor.startsWith('#')) {
    rgb = hexToRgb(backgroundColor)
  } else if (backgroundColor.startsWith('rgb')) {
    const matches = backgroundColor.match(/\d+/g)
    if (matches && matches.length >= 3) {
      rgb = {
        r: parseInt(matches[0], 10),
        g: parseInt(matches[1], 10),
        b: parseInt(matches[2], 10)
      }
    }
  }

  if (!rgb) return 'var(--text-primary)'
  const luminance = getLuminance(rgb.r, rgb.g, rgb.b)
  return luminance > 0.5 ? '#1a1a1a' : '#f5f5f5'
}

const colorClass = computed(() => {
  if (!props.task.color) return 'default'
  return props.task.color
})

const cardStyle = computed(() => {
  const bgColor = postitBackgroundCss(props.task.color)
  return {
    backgroundColor: bgColor,
    color: getContrastColor(bgColor)
  }
})
</script>

<style scoped>
.task-card {
  position: relative;
  background: var(--postit-default);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-postit);
  min-height: 100px;
  cursor: grab;
  transition: transform var(--transition-base), box-shadow var(--transition-base);
  break-inside: avoid;
  touch-action: pan-y;
  user-select: none;
}

.task-card:active {
  cursor: grabbing !important;
  transform: rotate(1deg) scale(1.02);
}

.task-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-postit-hover);
}

.task-card.sortable-ghost {
  opacity: 0.4;
  cursor: grabbing !important;
}

.task-card.sortable-drag {
  cursor: grabbing !important;
  opacity: 0.9;
  transform: rotate(2deg) scale(1.05);
  box-shadow: var(--shadow-xl);
  z-index: 1000;
}

@media (max-width: 768px) {
  .task-card {
    min-height: 80px;
    padding: var(--spacing-sm);
  }

  .task-card:active {
    transform: rotate(0.5deg) scale(1.01);
  }
}

.task-card__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  min-width: 0;
}

.task-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  margin-top: 2px;
}

.task-card__assignees {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  min-height: 28px;
  flex: 1;
  min-width: 0;
}

.task-card__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  font-size: 10px;
  font-weight: var(--font-weight-semibold);
  color: #fff;
  letter-spacing: -0.02em;
  flex-shrink: 0;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.12);
}

.task-card__avatar--more {
  background: rgba(0, 0, 0, 0.35);
  font-size: 9px;
}

.task-card__detail-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  margin-left: auto;
  border: none;
  border-radius: var(--border-radius-sm);
  background: rgba(0, 0, 0, 0.08);
  color: inherit;
  cursor: pointer;
  opacity: 0.75;
  transition: opacity var(--transition-base), background var(--transition-base);
}

.task-card__detail-btn:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.12);
}

.task-card__detail-icon {
  width: 16px;
  height: 16px;
}

.task-card__title {
  font-size: var(--font-size-base);
  line-height: var(--line-height-relaxed);
  color: var(--text-primary);
  word-wrap: break-word;
  margin: 0;
  cursor: pointer;
  font-weight: var(--font-weight-normal);
}

.task-card__delete {
  position: absolute;
  top: var(--spacing-xs);
  right: var(--spacing-xs);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  opacity: 0;
  padding: 4px;
  border: none;
  background: transparent;
  border-radius: var(--border-radius-sm);
  transition: opacity var(--transition-base), color var(--transition-base), transform var(--transition-base),
    background var(--transition-base);
  cursor: pointer;
  z-index: 10;
}

.task-card__delete-icon {
  width: 18px;
  height: 18px;
}

.task-card:hover .task-card__delete {
  opacity: 1;
}

.task-card__delete:hover {
  color: #d32f2f;
  background: rgba(211, 47, 47, 0.08);
  transform: scale(1.08);
}

.task-card__delete:active {
  transform: scale(1.02);
}
</style>
