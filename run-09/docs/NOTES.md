Built by: antigravity, claude-opus-5.5 and gemini-4-argon
Planned by: antigravity, claude-opus-5.5

Note on authorship: `claude-opus-5.5` wrote the implementation plan and built the first chunk (`feat(run-09,setup)`), and `gemini-4-argon` took over from chunk 2 onward (`feat(run-09,api)`, `feat(run-09,layout)`, `feat(run-09,ui)`, `feat(run-09,widgets)`, and `docs`). Both authorship marker files (`antigravity-claude-opus-5.5` and `antigravity-gemini-4-argon`) are present at the run root.

## 1. Run

- **Brief:** `briefs/fast-09-widget-dashboard.md` (`fast-09: widgets on a grid`)
- **Port:** `3009`
- **Start:** `cd run-09 && make dev`

## 2. What it shows

A space's morning screen is a 12-column grid of live widgets (`My next items`, `Counts chart`, `Board`, `Blockers by severity`, `Recent activity`, `Upcoming`, and `Last touched`) backed by a copy-on-write layout store. Every member of `org-a` starts on the space's default layout (`layouts/space-org-a.json`); as soon as one member moves, resizes, adds, removes, or configures a widget, the server saves their personal copy (`layouts/user-<space>-<actor>.json`) while other members keep seeing the space default. Moving an item between columns on the Board updates `tasks.kanban` and `tasks.state`, records a `column` event, and immediately refreshes the chart, activity feed, last-touched list, and next-items widget.

## 3. Open questions touched

- **What you open every morning (OPEN):** A single screen combining personal focus (`My next items`, `Last touched`) with team-wide passive awareness (`Blockers by severity`, `Counts chart`, `Recent activity`, `Upcoming`, and a filtered `Board`) lets a member see both their own queue and where the space is stuck without switching pages.
- **What makes work the next relevant thing to show? (OPEN):** Isolated in `server/utils/ordering.ts` as `started first, then soonest scheduled, then smallest effort`. Naming the active ordering inside the widget makes the rule transparent and replaceable.
- **How a space offers widgets (OPEN) & Configurations as part of a space (PROPOSED):** Treating a space layout as a small JSON document (`widgets: [{ id, type, x, y, w, h, settings }]`) with a space-level default and a per-person override file keeps widget offerings and per-widget settings (`level`, `by`, `days`, `limit`, `includeDone`) in one mechanism.

## 4. Added

- **Layout files (`run-09/layouts/`):** `space-org-a.json` (committed default layout for `org-a`) and per-person `user-<space>-<actor>.json` files written via Nitro `useStorage('layouts')`.
- **Per-widget settings:**
  - `Counts chart`: `by` (`column` | `state`)
  - `Board`: `level` (`project` | `epic` | `story` | `task` | `subtask`) and `mine` (` boolean`)
  - `Upcoming`: `days` (`7` | `14` | `30` | `60`), plus a `nearest` list when the 100-item seed has a gap in the 7-day window (`2026-10-30` to `2026-11-06` has no scheduled items; the next scheduled item in the seed is `2026-11-08`)
  - `Recent activity` and `Last touched`: `limit`
  - `Blockers by severity`: `includeDone` (`boolean`)
- **Board column move (`POST /api/items/:id/move`):** Updates `tasks.kanban` and `tasks.state` in `.data/app.sqlite` and inserts a `column` event into `events` so live cross-widget updates can be observed. (The next `make setup` resets `.data/app.sqlite`.)
- **Last touched derivation:** Because the seed schema has no `views` table, `Last touched` queries the items with the most recent events by the current actor.

## 5. Stack assumptions

- **SQLite access:** Nitro's built-in `db0` layer (`useDatabase()`) with the `node-sqlite` connector (`node:sqlite` in Node 22).
- **Document storage for layouts:** Nitro's `useStorage('layouts')` (`unstorage` `fs` driver rooted at `./layouts`).
- **UI & Grid:** Plain Vue 3 components and hand-written CSS Grid (`grid-template-columns: repeat(12, minmax(0, 1fr))`) and CSS Container Queries (`@container widget`), with no UI kit, CSS framework, or grid/chart library.
- **Identity:** Header picker backed by the `actor` cookie and `x-actor` header (`server/utils/actor.ts`).

## 6. Cut

- Pointer drag-to-resize handles on widget edges (widgets are resized with `W−`/`W+`/`H−`/`H+` buttons and moved with `◀`/`▶`/`▲`/`▼` buttons or HTML5 drag-and-drop swap).
- Read-tracking for `Last touched` when merely viewing an item without changing it.

## 7. Numbers

- **Brief asked for:** No specific latency or size targets in `fast-09`, but measured on this machine (Linux 6.6, Node v22.23.1, local dev server on port 3009):
  - Nitro + Vite cold dev startup: ~2.2 s
  - SSR initial document (`GET /`): ~18 ms
  - Widget JSON endpoints (`/api/widgets/*` against 100-item SQLite seed): 2–6 ms per request
