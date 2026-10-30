# Layout storage: space default and personal copy

The brief asks for layouts stored on the server **per space (the default)** and **per person (their own copy once they change it)**, with a reset action back to the space's default.

## Why Nitro `useStorage('layouts')` (`fs` driver)?

1. `.data/app.sqlite` is rebuilt from `scripts/schema.sql` and the seed CSVs every time `make setup` runs, and `.data/` is gitignored.
2. A layout is a hierarchical configuration document (`widgets[]`, each with `x, y, w, h` and arbitrary per-widget `settings`).
3. Mounting `storage.layouts = { driver: 'fs', base: './layouts' }` in `nuxt.config.ts` stores each layout as a plain JSON file under `run-09/layouts/`, outside `.data/`, so the space default (`run-09/layouts/space-org-a.json`) is committed to git and readable with `cat`.

## Copy-on-write lookup order

1. **`GET /api/layout?space=org-a`** checks `user-org-a-<actor>.json` first.
   - If that file exists, the route returns `{ source: 'personal', layout }`.
   - If not, it reads `space-org-a.json` (creating it from `builtInDefaultLayout()` if missing) and returns `{ source: 'default', layout }`.
2. **`PUT /api/layout?space=org-a`** writes `user-org-a-<actor>.json`.
   - When `person-1` (Ada) moves, resizes, removes, or reconfigures a widget, only `user-org-a-person-1.json` is written.
   - When `person-2` (Ben) opens `org-a`, `user-org-a-person-2.json` does not exist, so Ben still sees `space-org-a.json`.
3. **`DELETE /api/layout?space=org-a`** deletes `user-org-a-<actor>.json`, returning the member immediately to `space-org-a.json`.
