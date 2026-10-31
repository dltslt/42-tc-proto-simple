# Frontend Architecture

The frontend is implemented in Nuxt 4 and Vue 3 using standard Composition API scripts, reactive refs, and hand-written CSS without external UI frameworks.

## Real Modules and Files

- `app/app.vue`: The top-level application component. Coordinates global state: active zoom target (`currentZoomId`), identity actor selection, motion state (`animationsEnabled`), and global key listeners (`Ctrl+P` / `Cmd+P`).
- `app/components/Registerkarten.vue`: The notebook divider tabs component. Renders the ancestor path leading to the current zoom layer. Tabs adapt responsively:
  - On desktop (`min-width: 768px`): rendered as vertical notebook tabs along the left edge with staggered styling and level indicator badges.
  - On mobile (`max-width: 767px`): rendered horizontally across the top with smooth horizontal scrolling.
  - Clicking any tab emits a `zoom` event to jump immediately back out to that ancestor.
- `app/components/ZoomLayer.vue`: The main canvas representing the current zoom level.
  - **Item details**: Displays current item level, ID, inline editable title and description, and kanban column selector.
  - **Child creation bar**: Fast input element that accepts an item title and Enter keydown to create a child directly underneath the current item.
  - **Children tiles**: Grid of child item cards displaying level chips, kanban column tags, assignee, and click-to-zoom actions.
  - **Kanban board**: Multi-column board displaying children categorized by column (`backlog`, `design`, `build`, `QA`, `done`), with drag-and-drop or select mover.
  - **View mode switcher**: Toggles between Tiles, Board, and Split views.
- `app/components/CommandPane.vue`: Accessible modal command palette.
  - Traps focus and responds to `ArrowUp`, `ArrowDown`, `Enter`, and `Escape`.
  - Performs live fuzzy item searches via `GET /api/items/search?q=...`.
  - Displays breadcrumb paths so deep tasks can be identified and selected instantly.
  - Provides quick action commands (`Zoom Out`, `New Item Here`, `Toggle Animations`, `Switch Space`).

## View Transitions and Motion

Motion follows modern web standards and the `modern-web-guidance` skill:
- Defaults to motion off if the user agent reports `prefers-reduced-motion: reduce`.
- When enabled, layer updates trigger `document.startViewTransition()`, with custom scale/opacity keyframes targeting `::view-transition-old(zoom-stage)` and `::view-transition-new(zoom-stage)`.
- When motion is disabled, a global `.no-animations` rule overrides all animation durations and transitions to zero (`animation: none !important; transition: none !important;`), guaranteeing that nothing moves.
