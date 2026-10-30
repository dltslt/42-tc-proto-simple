# Design

This run answers one question: how few steps does the ordinary life of a task
take, from a title to done? One screen holds everything: an input that creates
an item from a title alone, a list whose rows move by key or click, an
in-place detail editor, an activity panel of the other members' events, and a
counter of the steps each journey took.

```mermaid
flowchart LR
  picker[Header: user + space pickers] -- x-actor-id header --> routes
  input[Create input] -- POST title --> routes
  row[List row: arrows / h l x / buttons] -- PATCH kanban --> routes
  detail[Item detail: fields save on blur or tick] -- PATCH field --> routes
  subgraph routes[server/api]
    items[items GET POST]
    item[items/:id GET PATCH]
    activity[activity GET]
    columns[columns, members, me, tags]
  end
  routes -- db0, node-sqlite --> db[(.data/app.sqlite)]
  activity -- poll 3s --> panel[Activity panel]
  steps[useSteps composable] -- counts --> meter[Step meter]
```

Nuxt features in use: `server/api/` file routing, `server/utils/` auto-imports,
`useFetch` with reactive options, `$fetch`, `ref`/`computed`/`watch`,
components auto-imported from `app/components/`, a composable in
`app/composables/`, and one hand-written stylesheet.
