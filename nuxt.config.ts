// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  runtimeConfig: {
    public: {
      databaseUrl: process.env.DATABASE_URL || ''
    }
  },
  ssr: false, // Client-side only para evitar problemas con Neon en servidor
  app: {
    head: {
      title: 'Postly - Tareas simples, mente clara',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Postly: Organiza tus tareas de forma simple y eficiente. Tableros Kanban intuitivos para mantener tu mente clara.' },
        // Open Graph / Facebook
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: 'Postly - Tareas simples, mente clara' },
        { property: 'og:description', content: 'Organiza tus tareas de forma simple y eficiente. Tableros Kanban intuitivos para mantener tu mente clara.' },
        { property: 'og:image', content: '/logo-png/Logo-Postly.png' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:alt', content: 'Logo de Postly' },
        // Twitter
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'Postly - Tareas simples, mente clara' },
        { name: 'twitter:description', content: 'Organiza tus tareas de forma simple y eficiente. Tableros Kanban intuitivos para mantener tu mente clara.' },
        { name: 'twitter:image', content: '/logo-png/Logo-Postly.png' },
        { name: 'twitter:image:alt', content: 'Logo de Postly' }
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/logo-png/Logo-Postly.png' },
        { rel: 'apple-touch-icon', href: '/logo-png/Logo-Postly.png' }
      ]
    }
  }
})
