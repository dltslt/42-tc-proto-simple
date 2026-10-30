// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  // The stylesheet is global; `~` is the app directory.
  css: ['~/assets/css/main.css'],
})
