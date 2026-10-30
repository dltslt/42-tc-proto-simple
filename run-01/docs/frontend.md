# Frontend

One page, no router. `app/app.vue` holds the state: the acting person
(`actorId`), the open space (`spaceId`), the open item, and the title being
typed. Nuxt auto-imports `ref`, `computed`, `watch`, `useFetch`, `$fetch`, and
everything in `app/components/` — none of them are imported by hand.

## Data

- `useFetch('/api/me', { headers })` — the acting person's spaces. The
  `headers` option is a `computed`; when the header picker changes the person,
  every request that shares it reruns.
- `useFetch(() => `/api/spaces/${spaceId}/items`)` — the list. A function URL
  refetches when `spaceId` changes.
- The same pattern serves `members`, `columns`, `activity`, and `tags`.

## Gestures

`app/components/ItemRow.vue` is a focusable `<li>` (`tabindex="0"`). Its
`@keydown` maps: `→` or `l` to the next column, `←` or `h` back, `x` to the
first `done` column, `Enter` to open the detail. Three buttons on each row do
the same for mouse and touch. Every gesture is one PATCH with `{ kanban }`;
the server returns the updated item and the page refreshes the list and the
activity panel.

## Editing in place

`app/components/ItemDetail.vue` loads `/api/items/:id`. Title, description,
and effort save on blur; contributors and tags are checkboxes that PATCH on
every tick. There is no save button and no form. Each PATCH writes one event
on the server, and `refresh()` reloads the item's event log.

## Steps and activity

`app/composables/useSteps.ts` is a four-state machine (`idle → created →
started → closed`) that counts the gestures of the latest journey; the meter
under the input shows the counts. `app/components/ActivityPanel.vue` renders
the events of the other members; `app.vue` polls it with `setInterval` every
three seconds, so another member's change appears without anyone sending a
message.
