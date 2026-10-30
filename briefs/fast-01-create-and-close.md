# fast-01: create a task and close it

**Kind:** fast
**Seed:** 100 items
**Question:** how few steps does the ordinary life of a task take, from a title to done?

## Scenario

A member of an organisation space opens the space, types a title, and has a task. They start it, move it through the columns, and close it. Every step writes an event. A second member sees the change without anyone sending a message (passive communication).

## Build

- A list of the space's items, newest first, with the kanban column shown in one cell.
- One input that creates an item from a title alone (Enter creates it). Nothing else is asked for.
- On each row, one gesture moves the item to the next column, a second moves it back, and a third closes it (moves it to the first `done` column). Use keys and a click. A swipe on a narrow screen is welcome but not required.
- Opening a row shows the other fields (description, effort, contributors, tags), editable in place. Each field saves on its own: no save button, no form.
- An event is written for create, column change, and field edits. The item shows its events.
- An "activity" panel shows the events from the other members of the space. Switch the current user in the header to check it.
- Count and show the steps (key presses or clicks) each journey took: create, start, close.

## Done when

- A task exists after typing a title and pressing Enter, and the count says one step after typing.
- Start and close each take one step.
- The state shown (`unstarted`, `started`, `done`) always follows the column, and the two cannot disagree.
- After switching the user, the activity panel shows what the first user did.

## Out of scope

Approval or gates for moving an item. A review state (a review is a new task, per the spec). Notifications beyond the activity panel.

## Touches

A default `new` state (OPEN): show how a fresh item is placed and name the stub. Which item to show next (OPEN): name the ordering used.
