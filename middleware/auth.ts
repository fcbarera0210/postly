export default defineNuxtRouteMiddleware(() => {
  if (import.meta.server) return
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated()) {
    return navigateTo('/')
  }
})
