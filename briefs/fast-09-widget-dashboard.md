# fast-09: widgets on a grid

**Kind:** fast
**Seed:** 100 items
**Question:** what does a space's interface look like when it is built from widgets a person takes up or leaves, and what would they open in the morning?

## Scenario

A member of an organisation space builds their morning screen: they add a few widgets to a grid, move and resize them, remove one, and come back later to the same layout. A second member of the same space sees the space's default layout, not the first member's.

## Build

- A grid of widgets. Add from a catalogue, move, resize, remove. The layout is a configuration stored on the server, per space (the default) and per person (their own copy once they change it).
- Widgets in the catalogue, each reading live data:
  - **My next items:** my items not done. Name the ordering (it is OPEN).
  - **Blockers by severity:** open blockers in the space, grouped by the four severities. This is the blockers dashboard from the spec.
  - **Recent activity:** the last events in the space.
  - **Counts chart:** items per column, or per state, as a bar chart drawn by hand.
  - **Upcoming:** items scheduled in the next seven days.
  - **Last touched:** items I viewed or changed most recently.
  - **Board:** a small board for one level, filtered.
- A widget has settings (for example the level on the board, the range on upcoming), stored with the layout.
- A "reset to the space's default" action.

## Done when

- Two members of the space get different layouts after one of them changes theirs, and the other still sees the default.
- The layout survives a reload.
- Every widget shows real seeded data and updates after a change elsewhere (move an item, then look at the chart and the activity).

## Out of scope

Who may edit the space's default (policies are stubbed as allow-all). Templates. A prompted dashboard (LATER).

## Touches

What you open every morning (OPEN). How a space offers widgets (OPEN). Configurations as part of a space (PROPOSED).
