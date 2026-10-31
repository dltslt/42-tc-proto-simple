# Backend Architecture

The backend runs entirely within Nuxt Nitro server routes using Node 22's native `node:sqlite` module to read and write directly to `.data/app.sqlite`.

## Real Modules and Files

- `server/utils/db.ts`:
  Provides a singleton connection to `.data/app.sqlite` using Node 22's built-in `DatabaseSync` class. It resolves the database path relative to the runtime process or the run directory.
- `server/utils/stubs.ts`:
  Contains the three required product stubs in one named location:
  1. `can(actor, action, resource)`: Allow-all security check returning `true`.
  2. `getTaskOrderSql()`: Ordering of "what to show next", prioritizing active work (`started` columns first, then `unstarted`, then `done`, ordered by ID).
  3. `getDefaultColumn(spaceId)`: Retrieves the first column with `state = 'unstarted'` for a given space.
  4. Identity stub: Reads the acting person or agent from the `x-lerch-actor` HTTP header or cookie, defaulting to `actor-1`.
- `server/api/spaces.get.ts`:
  Nitro handler mapped to `GET /api/spaces`. Returns all spaces, available actors, and space columns for space switching and identity headers.
- `server/api/zoom.get.ts`:
  Nitro handler mapped to `GET /api/zoom?target=...`.
  - When `target` is a space (e.g. `space:org-a`), loads the space record and queries root items (`parent_id = ''`).
  - When `target` is an item (e.g. `item-1`), loads the item, traverses `parent_id` upward to construct the full ancestry chain up to the root space, queries the item's immediate children, and loads the space's kanban columns.
- `server/api/items/index.post.ts`:
  Nitro handler mapped to `POST /api/items`.
  - Takes `{ title, parentId, space, level, kanban }`.
  - Resolves child level automatically from parent level (`project` → `epic` → `story` → `task` → `subtask`).
  - Defaults kanban column to the space's first unstarted column.
  - Generates the next sequential item ID (`item-N`).
  - Inserts into `tasks`, records parent-child link in `relations`, and logs a creation record in `events`.
- `server/api/items/[id].patch.ts`:
  Nitro handler mapped to `PATCH /api/items/:id`.
  - Allows inline editing of `title`, `description`, `kanban`, `lead`, `effort`, and `scheduled_time`.
  - Enforces invariant: `tasks.state` strictly mirrors the category of `tasks.kanban` in `columns`.
  - Logs an update record in `events`.
- `server/api/items/search.get.ts`:
  Nitro handler mapped to `GET /api/items/search?q=...`.
  - Performs substring search over titles and IDs.
  - Enriches each matching task with its full ancestor breadcrumb path for display in the Command Pane.
