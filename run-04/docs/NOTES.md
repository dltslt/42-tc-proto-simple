Built by: antigravity, claude-opus-5.5

# NOTES — run-04

## Run

Brief: `briefs/fast-04-one-item-many-views.md` (fast, 100-item seed). Port **3004**. Start it with `make dev` inside `run-04`, then open http://localhost:3004.

## What it shows

The items of one space appear as a sortable list, a kanban board, and a week/month calendar, side by side or as tabs. All three read one client-side store. Dragging a card to another lane, or a calendar entry to another day, goes to the server and back into the store. The other views change at once, without a reload, and the change survives a reload.

## Open questions touched

- **Views (OPEN):** the three choices for each view are in `docs/views.md`. The run suggests that one fixed field order, cut from the end, makes an item easy to recognise across views. The calendar chip has room for the title only, so the column shows there only as a coloured border. A level filter fits the board but takes away the list's "all levels" mode when the two share it.
- **Policies (OPEN):** `can()` allows everything (`server/utils/policy.ts`).

## Added

- An `events` row on each change. Kind `column` matches the seed. Kind `rescheduled` (detail `old → new`) is a new value.
- A tray item dropped on a day gets 09:00 local time. A rescheduled entry keeps its time of day. Weeks start on Monday.
- Card field order: title · level · column · effort · scheduled · contributors · tags. The chip shows the title only.
- The state colour on the left border: grey unstarted, orange started, green done.
- An acting-as picker in an `actor` cookie (default `person-1`).
- A side-by-side / tabs toggle.

## Stack assumptions

- db0 with the `node-sqlite` connector on `.data/app.sqlite`, through Nitro `experimental.database`.
- Native HTML drag and drop, with no library. Hand-written CSS.
- The browser check used puppeteer-core with the system Chromium, from a scratch folder outside the run. It is not a dependency of the run.

## Cut

- The **space** filter is the store's space picker (organisation spaces only). It reloads the store instead of narrowing it, because the brief says the store holds the current space. The seed has items only in `org-a`, so a pure narrowing filter would show nothing new.
- Creating items, and editing fields other than column and time. Unscheduling (dragging back to the tray). Touch and keyboard drag.
- No tests (fast brief).

## Numbers

None asked for. The page loads 100 items in a single request on a laptop running the dev server.
