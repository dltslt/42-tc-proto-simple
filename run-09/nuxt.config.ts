// https://nuxt.com/docs/api/configuration/nuxt-config
// defineNuxtConfig is auto-imported by Nuxt: no import line is needed.
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  nitro: {
    // Turns on Nitro's built-in SQL layer (db0). Server code calls useDatabase().
    experimental: { database: true },
    database: {
      // node-sqlite = Node 22's own `node:sqlite` module. Nothing to compile.
      // The path is relative to the run directory, where `make dev` starts.
      default: { connector: 'node-sqlite', options: { path: '.data/app.sqlite' } }
    },
    // Nitro key-value storage. useStorage('layouts') reads and writes JSON
    // files in run-09/layouts/. That folder is committed, unlike .data/.
    storage: {
      layouts: { driver: 'fs', base: './layouts' }
    }
  }
})
