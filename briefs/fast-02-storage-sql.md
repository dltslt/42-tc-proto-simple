# fast-02: the data model in SQL, and how fast it reads

**Kind:** fast
**Seed:** 10,000 items
**Question:** what does the data model look like as tables, and what does it cost to read the views we need from 10,000 items?

## Scenario

`make setup` has stored the seed as tables in `.data/app.sqlite`. A small page runs a fixed set of queries and shows their timings and results. Another run answers the same query set with document storage, so keep the queries exactly as written.

## Build

- Read the tables already in `.data/app.sqlite`. `scripts/schema.sql` at the repository root is that schema.
- The **query set** below as server routes. Each route returns its rows and the time it took on the server.
- A page `/bench` that runs every query 20 times and shows the median and the slowest time per query.
- Add indexes one by one and record what each one changed. The index statements live in the run's code and run when the server starts. `.data/` is rebuilt by `make setup` and is not committed, so an index that exists only inside the file is lost.
- Also measure at 100,000 items. That measurement is a second SQLite file outside `.data/`.

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

- `/bench` shows all ten queries with timings at 10,000 items.
- NOTES.md lists the schema, the indexes kept, and the three slowest queries with a sentence on why they are slow.
- NOTES.md says, in plain words, which queries were easy in SQL and which were awkward.

## Out of scope

An interface beyond `/bench` and plain tables. Postgres.

## Touches

Which candidates are objects of their own (OPEN). Where score and severity are stored (OPEN). Whether a task sits in exactly one space (OPEN): query 5 shows the cost of the default.
