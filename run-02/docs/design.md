# Design

run-02 answers brief `fast-02-storage-sql`: what the Lerch data model looks
like as tables, and what it costs to read the views we need from 10,000
items. It is a bench, not a product screen. One page runs the brief's ten
queries against the seeded SQLite file and shows the times.

```mermaid
flowchart LR
  B["app/pages/bench.vue<br/>(runs each query 20x)"] -->|"$fetch /api/q1..q10"| R["server/api/q1..q10.get.ts<br/>(one route per query)"]
  R --> U["server/utils/queries.ts<br/>(the query set)"]
  U --> D["server/utils/db.ts<br/>(db0 + node:sqlite,<br/>indexes at start)"]
  D --> S[(".data/app.sqlite<br/>(seed, 10k)<br/>bench/bench-100k.sqlite<br/>(100k)")]
```

- Nuxt server routes under `server/api/` are the whole backend; a file there
  becomes a URL.
- The ten queries live in one module so the routes stay thin and the SQL is
  readable in one place.
- db0 is the database layer Nitro ships; the `node-sqlite` connector wraps
  `node:sqlite`, which Node 22 includes. Nothing needs compiling.
- `LERCH_DB` points the same code at the 100k file.
