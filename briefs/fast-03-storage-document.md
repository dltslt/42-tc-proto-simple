# fast-03: the data model as documents, and how fast it reads

**Kind:** fast
**Seed:** 10,000 items
**Question:** what changes in the code when the data is stored as documents instead of tables, and what does it cost to read the same views?

## Scenario

`make setup` has stored the seed as tables in `.data/app.sqlite`. This run stores that same data as documents in Nitro's key-value storage (`useStorage` with the `fs` driver). A small page runs a fixed set of queries and shows their timings. Another run answers the same query set with SQL tables, so keep the queries exactly as written.

## Build

- Decide the document shapes and write them down in one file (`model.ts` or similar). The interesting choices are what is embedded and what is referenced: are tags, artifacts, and events inside the item document or separate? Is the parent-child relation stored on the parent, on the child, or as its own document? Pick one shape, and note one alternative you rejected and why.
- Keys that make the common reads cheap (for example `space:<id>:item:<id>`). Any index you need, you maintain yourself in code. That cost is part of the answer.
- Read `.data/app.sqlite` and write the documents in the run, outside `.data/` (for example `store/`), so they are committed.
- The **query set** below as server routes. Each route returns its rows and the time it took on the server.
- A page `/bench` that runs every query 20 times and shows the median and the slowest time per query.
- Also measure at 100,000 items, or note why not. That measurement's files stay outside `.data/`.

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
- NOTES.md shows the document shapes and every index maintained by hand.
- NOTES.md says, in plain words, what was easy and what was awkward: moving an item with its event (query 8, there is no transaction), counting (query 9), and one person's items across spaces (query 5).

## Out of scope

MongoDB or any document database server.

## Touches

Which candidates are objects of their own (OPEN). Where score and severity are stored (OPEN). Whether a task sits in exactly one space (OPEN). This run is input for the team's SQL or NoSQL decision. It is not the decision.
