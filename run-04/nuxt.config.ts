// https://nuxt.com/docs/api/configuration/nuxt-config
// defineNuxtConfig is a Nuxt auto-import: no import line is needed.
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  // Global stylesheet, loaded on every page.
  css: ['~/assets/main.css'],
  nitro: {
    // Turns on Nitro's built-in database layer (db0) and useDatabase().
    experimental: { database: true },
    database: {
      // The "default" connection. node-sqlite uses Node 22's built-in node:sqlite.
      // The file was built by `make setup`; we only read and update it.
      default: { connector: 'node-sqlite', options: { path: '.data/app.sqlite' } }
    }
  }
})
