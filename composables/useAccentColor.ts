import { isUserAccentColorKey } from '~/utils/postitColors'
import type { User } from '~/utils/types'

const BRAND_VARS = ['--brand-primary', '--brand-primary-hover', '--brand-primary-active'] as const

export function useAccentColor() {
  function clearAccentOverrides() {
    if (!import.meta.client) return
    const root = document.documentElement
    for (const v of BRAND_VARS) {
      root.style.removeProperty(v)
    }
  }

  function applyAccentColor(accent: string | null | undefined) {
    if (!import.meta.client) return
    const root = document.documentElement
    if (accent == null || accent === '') {
      clearAccentOverrides()
      return
    }
    if (!isUserAccentColorKey(accent)) {
      clearAccentOverrides()
      return
    }
    root.style.setProperty('--brand-primary', `var(--postit-${accent})`)
    root.style.setProperty(
      '--brand-primary-hover',
      'color-mix(in srgb, var(--brand-primary) 88%, black)'
    )
    root.style.setProperty(
      '--brand-primary-active',
      'color-mix(in srgb, var(--brand-primary) 75%, black)'
    )
  }

  function applyAccentFromUser(user: Pick<User, 'accent_color'> | null) {
    applyAccentColor(user?.accent_color ?? null)
  }

  return {
    clearAccentOverrides,
    applyAccentColor,
    applyAccentFromUser
  }
}
