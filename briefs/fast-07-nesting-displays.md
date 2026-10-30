# fast-07: showing nesting

**Kind:** fast
**Seed:** 100 items
**Question:** which display makes a deep hierarchy readable, and which one hides it?

## Scenario

A member looks at the project with the most descendants through four displays of the same tree and compares them.

## Build

Four displays of the same subtree, as tabs, sharing one selection (selecting an item in one selects it in the others):

1. **Outline:** an indented tree, collapsible, with keyboard navigation (arrows to move, right and left to open and close). Children load when a node opens.
2. **Breadcrumb drill-down:** one level at a time as a list, with the path above it.
3. **Nested boxes:** children drawn inside their parent (a treemap or plain nested blocks), sized by effort or by the number of descendants.
4. **Columns:** one column per level, like a file browser (Miller columns).

Each node shows its title, its state, and a count of done descendants (for example `12/40`).

Moving a node to another parent: drag in the outline, or a "move to" command. It changes the parent-child relation record, not a field on the item.

## Done when

- All four displays show the same project and keep the same selection.
- Moving a task to another story updates the done counts in every display.
- NOTES.md says which display was easiest for "where is this task" and which for "how far along is this project".

## Out of scope

Mixing levels on a board. Editing fields beyond the title.

## Touches

Hierarchy (SETTLED: relation records). The "a task fits in a day" rule vs. tasks as large as an epic (OPEN): the done counts show what depth does to the numbers.
