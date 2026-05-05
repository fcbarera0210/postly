export default defineNuxtPlugin(async () => {
  const auth = useAuth()
  const { applyAccentFromUser, clearAccentOverrides } = useAccentColor()

  if (!auth.isAuthenticated()) {
    clearAccentOverrides()
    return
  }

  const user = await auth.getCurrentUser()
  applyAccentFromUser(user)
})
