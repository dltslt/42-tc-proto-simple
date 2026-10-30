# The three views

The brief asks for three choices per view: which items, how they are drawn, and which action is primary. All three views read the same filtered store. A card's fields always come in this order: **title · level · column · effort · scheduled · contributors · tags**. Each view cuts from the end.

| | Which items | How drawn | Primary action |
|---|---|---|---|
| **List** | everything the filter lets through, any level | one table row, all 7 fields | sort by column (board position), effort, or scheduled. Empty values go last |
| **Board** | one level only (project, epic, story, task). The switch sets the shared level, so the list follows | one lane per kanban column of the space, cards with 6 fields (no tags) | drag a card to another lane, which changes kanban and state |
| **Calendar** | filtered items with a scheduled time. The tray holds items with effort but no time | week (7 days) or month (6 × 7), chips with the title only, time above | drag a chip or a tray item to a day |

What the run suggests:

- The column is what the board is about, so the board card keeps it. The calendar chip has no room for it and shows it only as the coloured left border (grey unstarted, orange started, green done). That border is how a board move "shows" on the calendar.
- A level filter belongs to the board. Sharing it with the list makes the list useful as a check of the board, but the list loses its "all levels" mode while the board is in use.
- The calendar reads poorly with long titles. A chip needs a short title, or a hover.
