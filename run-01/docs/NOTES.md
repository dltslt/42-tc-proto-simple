Built by: Mistral Vibe, mistral

## Run

fast-01 (create a task and close it). Seed: 100 items. Start with `make dev`
in `run-01/`; the server listens on port 3001.

## What it shows

One screen: type a title, press Enter, and the task exists in the space's
first `unstarted` column. Focus a row and `→` starts it, `x` closes it (the
first `done` column); the same three gestures are click buttons. The detail
saves every field on its own blur or tick, and each change writes an event.
The activity panel on the right shows the other members' events, polled every
three seconds — switching the header user shows what the first one did.

## Open questions touched

- **Default `new` state** (OPEN): a fresh item goes to the space's first
  `unstarted` column, so its state is `unstarted`. Stub named
  `NEW_ITEM_PLACEMENT` in `server/utils/stubs.ts`.
- **What to show next** (OPEN, gold): no product rule exists; this run
  experiments with "newest created first", named `NEXT_RELEVANT_ORDERING` in
  the same stubs file.
- **Policies** (OPEN): allow-all behind `can(actor, action, resource)` in
  stubs.ts, already called by every route.

## Added

- `spec-time.ts`: new events are stored on the seed's calendar (today
  2026-10-30) and shifted to real time on read, so new items sort above the
  seed and shown times are real.
- Event `detail` text formats for `edit` (`field: 'old' -> 'new'`) and `tags`
  (`added: …; removed: …`). Kinds match the seed: `created`, `column`.
- The step meter counts one journey client-side: Enter is the create step,
  the first move is start, moves after that count toward close.
- The create input guards `isComposing` so an IME's Enter does not submit.

## Stack assumptions

- db0 with the `node-sqlite` connector (added as a direct dependency; Node
  22's built-in SQLite, nothing compiled). A later run should not assume a
  different driver.
- No login: the acting person travels in the `x-actor-id` header from the
  header picker (`server/utils/current-user.ts`).
- No UI kit, no CSS framework; one hand-written stylesheet.

## Cut

- No swipe gestures on narrow screens (the brief made them optional).
- The step meter counts only the latest journey and does not count reopening
  or moving a journey item backwards.
- No lead editing in the detail (the field exists in the database and the
  API shape, but the screen does not offer it).

## Numbers

- Journeys verified in the browser (laptop, dev server): create = 1 step
  (Enter after typing), start = 1 step (`→` or one click), close = 1 step
  (`x` or one click). The activity panel reflects another member's change
  within its 3-second poll.
