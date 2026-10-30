# fast-04: one item, many views

**Kind:** fast
**Seed:** 100 items
**Question:** does the same item read well as a list row, a board card, and a calendar entry, and does a change in one view show in all of them?

## Scenario

A member of an organisation space looks at the space's items as a list, a board, and a calendar, side by side or as tabs. They drag a card to another column on the board, and the list row and calendar entry change at once. They drag a calendar entry to another day, and the list and the card show the new time.

## Build

- One client-side store of items for the current space, loaded from the server. Every view reads it, and every change goes to the server and back into the store. No view keeps its own copy.
- **List:** one row per item, the column in one cell, sortable by column, effort, and scheduled time.
- **Board:** one column per kanban value of the space. Drag a card to move it. Only items of one level at a time (a level switch: projects, epics, stories, tasks).
- **Calendar:** a week and a month, showing items with a scheduled time. Drag to reschedule. Items with effort but no time sit in a side tray and can be dragged onto the calendar.
- A filter shared by all three views: space, level, contributor, tag. The filter is not the space (spec), it only narrows what is shown.
- Item cards show the same fields in the same order in every view, cut to what fits.

## Done when

- Moving a card on the board changes the row and the calendar entry without a reload.
- Rescheduling on the calendar changes the row.
- Switching the level on the board changes which items are cards, and the list follows the same filter.

## Out of scope

Gantt charts, graphs, dashboard widgets. Clash detection (the spec says: no clash detection by default).

## Touches

Views (OPEN): which views matter most and what a view is made of. Write down the three choices each view made: which items, how drawn, and which action is primary.
