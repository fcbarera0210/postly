import { userFacingErrorMessage } from '~/utils/errorMessage'

/** @deprecated Prefer userFacingErrorMessage para toasts; se mantiene para código legado. */
export function getFetchErrorMessage(e: unknown, fallback: string): string {
  return userFacingErrorMessage(e, fallback)
}
