# Backend

No separate backend: Nuxt's server routes under `server/api/` are the whole
API. A file becomes a URL — `server/api/spaces/[id]/items.get.ts` answers
`GET /api/spaces/:id/items`.

## Modules in `server/utils/`

Nitro auto-imports these into every route.

- `db.ts` — db0 with the `node-sqlite` connector (Node 22's built-in
  `node:sqlite`, nothing compiled) opening `.data/app.sqlite`, plus `all`,
  `get`, `run` helpers so routes read like plain SQL.
- `stubs.ts` — the product stubs in one place: the allow-all policy `can`,
  the ordering experiment (`newest created first`), and the placement of a
  new item (`first unstarted column`).
- `current-user.ts` — reads the `x-actor-id` header. That is the whole
  identity story; replacing the stub means replacing this function.
- `spec-time.ts` — the seed's timestamps live on a calendar whose today is
  2026-10-30. Reads shift stored times to real time; writes store real now
  shifted back, so new items sort above the seed.
- `items.ts` — the item queries and the one `appendEvent` writer.

## The state rule

`tasks.state` follows `tasks.kanban` through `columns`. Two mechanisms keep
them from disagreeing:

1. On write (PATCH): the route looks the column up and writes the column's
   `state` next to its name. A move is one UPDATE plus one event.
2. On read: both list and detail derive `state` from the `JOIN columns`, so
   only the column is believed even if storage drifted.

## Routes

| Route | What it does |
|---|---|
| `GET /api/spaces/:id/items` | the space's items, newest created first, tags attached |
| `POST /api/spaces/:id/items` | create from a title alone; first `unstarted` column; a `created` event |
| `GET /api/items/:id` | item, tags, and its event log |
| `PATCH /api/items/:id` | one move or one field per request; one event per change |
| `GET /api/spaces/:id/activity` | the other members' events, newest first, capped at 30 |
| `GET /api/spaces/:id/members`, `/columns`, `GET /api/me`, `/api/tags` | what the header and the detail editor need |
