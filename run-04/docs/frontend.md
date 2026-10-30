# Frontend

Everything is in `app/`. There is one page, `app/app.vue`, with no router pages.

## State: three composables

- `app/composables/useItems.ts` is **the store**. `useState('items')` holds every item of the current space, and every component that calls `useItems()` gets the same ref. `load()` fetches `/api/items`. `moveTo(id, column)` and `reschedule(id, date)` send a `PATCH` and put the server's answer into the array. No view changes an item itself, so no view can drift from the others.
- `app/composables/useFilter.ts` holds the shared filter (level, contributor, tag) and a `computed` called `filtered`. All three views read `filtered`, not `items`.
- `app/composables/useMeta.ts` fetches spaces, columns, actors, and tags once with `useFetch` (key `meta`), and exposes the columns of the current space.

## Components

| File | Role |
|---|---|
| `app.vue` | header (acting-as picker, filter, side-by-side / tabs), loads the store |
| `components/FilterBar.vue` | space, level, contributor, and tag selects, bound with `v-model` |
| `components/ItemCard.vue` | one item. The field order is fixed. `size="card"` shows 6 fields, `size="chip"` shows the title only |
| `components/ListView.vue` | a table with the same field order. Click a header to sort |
| `components/BoardView.vue` | one lane per column. The level buttons write `filter.level` |
| `components/CalendarView.vue` | week or month grid, plus a tray of items with effort but no time |

## Drag and drop

This is native HTML drag and drop, with no library. `ItemCard` puts the item id into `dataTransfer` on `dragstart`. A lane or a day accepts the drop with `@dragover.prevent`, then reads the id on `drop` and calls the store.

Styles are hand-written: `app/assets/main.css` plus a `<style scoped>` block in each component.
