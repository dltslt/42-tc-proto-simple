# Backend architecture

Nuxt's server engine is **Nitro**. Every file inside `server/api/` is compiled into an HTTP handler whose URL path and HTTP method come from the filename. Files inside `server/utils/` are auto-imported into every handler.

## Product stubs (`server/utils/`)

Each OPEN product question is isolated in one small module so a later team decision can replace it in one place:

- **`server/utils/policy.ts`**: `can(actor, action, resource)` — returns `true` for all actions.
- **`server/utils/actor.ts`**: `currentActor(event)` — reads the `x-actor` request header or the `actor` cookie, defaulting to `person-1` (Ada).
- **`server/utils/ordering.ts`**: `NEXT_ORDERING_NAME` and `NEXT_ORDER_BY` — orders a person's unfinished items by `state = 'started'` first, then earliest `scheduled_time` (empty last), then smallest numeric `effort`.
- **`server/utils/clock.ts`**: `shifted(iso)` and `unshifted(ms)` — shifts timestamps by the offset between the seed's base date (`2026-10-30T00:00:00Z`) and today.
- **`server/utils/place.ts`**: `NEW_ITEM_COLUMN_STATE = 'unstarted'` — names where a newly created item goes.
- **`server/utils/defaultLayout.ts`**: `builtInDefaultLayout()`, `spaceLayoutKey()`, and `userLayoutKey()`.

## Server routes (`server/api/`)

| Route file | Method & URL | Storage used | Purpose |
|---|---|---|---|
| `actors.get.ts` | `GET /api/actors` | SQLite (`actors`, `spaces`, `members`) | Supplies the header's person and space pickers |
| `spaces/[space]/columns.get.ts` | `GET /api/spaces/:space/columns` | SQLite (`columns`) | Lists kanban columns ordered by `position` |
| `layout.get.ts` | `GET /api/layout?space=` | `useStorage('layouts')` | Returns `user-<space>-<actor>.json` if present, else `space-<space>.json` |
| `layout.put.ts` | `PUT /api/layout?space=` | `useStorage('layouts')` | Saves the person's layout copy (or space default when `scope=default`) |
| `layout.delete.ts` | `DELETE /api/layout?space=` | `useStorage('layouts')` | Deletes the person's layout copy to reset to the space default |
| `widgets/next.get.ts` | `GET /api/widgets/next` | SQLite (`tasks`) | Actor's non-done items in `NEXT_ORDER_BY` order |
| `widgets/blockers.get.ts` | `GET /api/widgets/blockers` | SQLite (`blockers`, `tasks`) | Open blockers grouped by the four severities |
| `widgets/activity.get.ts` | `GET /api/widgets/activity` | SQLite (`events`, `tasks`, `actors`) | Most recent events in the space |
| `widgets/counts.get.ts` | `GET /api/widgets/counts` | SQLite (`columns`, `tasks`) | Item counts per column or per state |
| `widgets/upcoming.get.ts` | `GET /api/widgets/upcoming` | SQLite (`tasks`) | Items scheduled within the next N days (plus nearest future items) |
| `widgets/touched.get.ts` | `GET /api/widgets/touched` | SQLite (`events`, `tasks`) | Items with the most recent events by the current actor |
| `widgets/board.get.ts` | `GET /api/widgets/board` | SQLite (`columns`, `tasks`) | Columns and items for a chosen hierarchy `level` |
| `items/[id]/move.post.ts` | `POST /api/items/:id/move` | SQLite (`tasks`, `columns`, `events`) | Updates `kanban` and `state` together and inserts a `column` event |
