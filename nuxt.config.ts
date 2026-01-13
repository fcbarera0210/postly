// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  runtimeConfig: {
    public: {
      databaseUrl: process.env.DATABASE_URL || ''
    }
  },
  ssr: false // Client-side only para evitar problemas con Neon en servidor
})
