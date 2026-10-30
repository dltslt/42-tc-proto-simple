# Backend

Nitro (the server half of Nuxt) runs the files in `server/`. Each file in `server/api/` is a URL. The suffix names the HTTP method.

| Route | File | Does |
|---|---|---|
| `GET /api/spaces` | `server/api/spaces.get.ts` | spaces, columns (in position order), actors, tag names |
| `GET /api/items?space=` | `server/api/items.get.ts` | the items of one space, with their tag names |
| `PATCH /api/items/:id` | `server/api/items/[id].patch.ts` | `{kanban}` moves an item, `{scheduled_time}` reschedules it. Returns the item |

## Helpers in `server/utils/`

Nitro auto-imports these into every route.

- `items.ts`: `db()` (wraps `useDatabase()`), the `Item` shape, `itemsInSpace()`, `itemById()`. The raw TEXT columns become arrays and numbers here.
- `policy.ts`: `can(actor, action, resource)`. A stub that allows everything.
- `actor.ts`: `currentActor(event)` reads the `actor` cookie set by the header picker.

## Storage

The database is `.data/app.sqlite`, built by `make setup`. It is read through db0 with the `node-sqlite` connector, configured in `nuxt.config.ts`. A move looks up the target column in the item's space and copies the column's `state` onto the task, so `state` and `kanban` stay in agreement. Each change also inserts an `events` row: kind `column` (detail is the new column, the same shape as the seed) or kind `rescheduled` (detail is `old → new`).
