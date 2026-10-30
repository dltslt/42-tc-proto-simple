# Frontend architecture

For a C or C++ programmer: think of a Vue component (`.vue` file) as a struct that bundles state, an HTML template that is automatically re-rendered when that state changes, and scoped CSS rules. Nuxt auto-imports components from `app/components/` and shared functions ("composables") from `app/composables/`, so there is no header file to include unless you want explicit TypeScript types.

## Modules and files

- **`app/app.vue`**: The entry point. Fetches `/api/actors` once via `useFetch` and renders the top header with the acting-person `<select>` (`Ada`, `Ben`, `Cai`, …) and the space `<select>`.
- **`app/composables/useActor.ts`**: Exports `useDashboardContext()`.
  - `useCookie('actor')` binds the selected person ID to an HTTP cookie so both server rendering and browser fetches know who is acting.
  - `useState('current-space')` and `useState('widget-refresh-tick')` hold shared reactive values across components without global singletons that would leak between SSR requests.
- **`app/composables/useLayout.ts`**: Defines `WIDGET_CATALOGUE` (the seven widget types, their default column/row spans, and their default settings).
- **`app/components/WidgetGrid.vue`**:
  - Calls `useFetch('/api/layout')` watching `[spaceId, actorId]`.
  - Renders the toolbar showing whether the current person is viewing the space default (`Space default (org-a)`) or their own copy (`Personal layout (person-1)`), the catalogue drawer (`+ Add widget from catalogue`), and `Reset to space's default`.
  - Persists every move, resize, add, remove, drag-swap, or setting change via `$fetch('/api/layout', { method: 'PUT' })`.
- **`app/components/WidgetFrame.vue`**:
  - Positions each widget on the 12-column CSS grid using inline `grid-column: <x> / span <w>` and `grid-row: <y> / span <h>`.
  - Declares `container: widget / inline-size` so inner widget content can adapt to the widget's width (`@container widget`) instead of the browser window's width.
  - Exposes a named `<slot name="settings" />` in the frame header for widget-specific controls.
- **`app/components/widgets/*.vue`**:
  - `NextItems.vue`: calls `/api/widgets/next` and prints the name of the OPEN ordering stub.
  - `BlockersSeverity.vue`: calls `/api/widgets/blockers` and renders the four severity buckets.
  - `RecentActivity.vue`: calls `/api/widgets/activity`.
  - `CountsChart.vue`: calls `/api/widgets/counts?by=column|state` and draws proportional horizontal bars using plain `<div>` elements and percentage `inline-size`.
  - `UpcomingItems.vue`: calls `/api/widgets/upcoming?days=7|14|30|60`.
  - `LastTouched.vue`: calls `/api/widgets/touched`.
  - `MiniBoard.vue`: calls `/api/widgets/board?level=...`. When a card's column `<select>` changes, it posts to `/api/items/:id/move` and calls `triggerDataRefresh()`, which increments `refreshTick` and causes every widget on the grid to refetch.
