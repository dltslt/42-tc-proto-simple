# proper-01: the data model and its storage

**Kind:** proper
**Seed:** 10,000 items
**Question:** which data model and which storage should the team build on, and what layer does the rest of the code talk to?

## Findings from earlier runs

(Filled in by hand before this run starts. If empty, build on Postgres as below.)

## Scenario

A schema, a data access layer, and server routes on top of it, at a level the team can adopt, measured on the seed.

## Build

- Postgres, run in-process with PGlite (name it), unless the findings above point elsewhere. If they point to documents, make the case in NOTES.md before building. `make setup` already built `.data/app.sqlite` from the brief's seed. A PGlite directory, or any store this run builds, stays outside `.data/`, so it is committed.
- Migrations, not a hand-run schema file.
- One table or collection per record from the spec: item, actor, space, space member, parent-child relation, tag and item-tag, blocker, artifact, event, kanban column. State is derived from the column, not stored twice.
- A data access layer with one module per record. Server routes only call that layer. Nothing above it writes SQL or keys.
- The event log written in the same transaction as the change it records.
- The query set below through the layer, with tests that check their results on a small fixed set of items, and a `/bench` page that runs each query 20 times on the seed and shows the median and slowest time.
- A short `MODEL.md`: every record, its fields, its relations, and which open question each choice depends on.

### Query set

1. The items in one kanban column of one space, 50 per page, newest change first.
2. One item with its children, its parent chain up to the root, its tags, artifacts, and blockers in both directions.
3. The whole subtree under one project (all levels).
4. All open blockers in a space, grouped by severity, with both item titles.
5. One person's items that are not done, across every space they are a member of.
6. Items with a scheduled time in a given week, for a calendar.
7. Items with a given tag, plus how many of each other tag those items carry (for a filter panel).
8. Moving one item to another column, writing its event in the same transaction.
9. Counts per column and per state for a space (for a chart).
10. Title search for a word, first 20 hits.

## Done when

- Tests pass for the ten queries and for moving an item with its event.
- `/bench` shows the ten queries at 10,000 items.
- `MODEL.md` can be read by a teammate who has not seen any earlier run.

## Touches

Which candidates are objects of their own (OPEN). Where score and severity are stored (OPEN). Event fields (OPEN). Whether the web interface is built on the API (OPEN): the data access layer is where that question lands.
