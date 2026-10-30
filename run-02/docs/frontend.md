# Frontend

One page, plain Vue, hand-written CSS, no UI kit.

- `app/app.vue` — renders `<NuxtPage>`; the template must not mention
  components in comments *outside* a block, or the SFC parser reads them as
  unclosed elements.
- `app/pages/bench.vue` — the bench. A file under `app/pages/` becomes a
  route automatically. On mount it runs the ten routes sequentially, 20
  times each, and keeps the `ms` each response reports. Sequential because
  parallel requests would compete for the same SQLite file and skew the
  numbers. For every query it shows:
  - median and slowest server ms,
  - rows returned,
  - the first rows of one run,
  - the SQL, folded into a `<details>`.
- `/` redirects to `/bench` (`app/pages/index.vue`, `navigateTo`).

The page fixes the query list (`QUERIES`), because the brief wants a fixed
set; the SQL itself arrives with every response. A `Run again` button
repeats the whole bench. `/api/dbinfo` names the open file so a 10k and a
100k run are never confused.
