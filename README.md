# `ft_transcendence` Prototypes (no Docker)

Clone this repository and follow the steps below, then test-drive a prototype or start your own.

```
.
├── AGENTS.md       the rule every prototype agent follows, including how to commit
├── README.md       this file
├── PROMPT.md       the one prompt that starts a run; it names the run directory and one file in briefs/
├── briefs/         one brief per prototype; a run does not receive a copy
├── scripts/        tools for this repository
│   ├── new-run.sh      ./scripts/new-run.sh 06 copies template/ to run-06/ and sets that run up
│   ├── seed-tasks.mjs  writes the seed CSV for a run
│   ├── prepare-db.mjs  loads that CSV into the SQLite file
│   └── schema.sql      the tables in that file
├── spec/           short-agents-v1.md, the product context
├── template/       the Nuxt app every run copies; do not build a prototype here
└── run-*/          one run: a copy of template/, then that run's code; server on port 3000+NN
```

## Requirements

- Node.js `^22.22.3`, `^24.15.0`, or `26` or newer
- `make`
- pnpm `12.16.1`

`pnpm` is the installer (replacing `npm`) so the runs do not each keep a full copy of `node_modules`. Get it from https://pnpm.io/:

```
curl -fsSL https://get.pnpm.io | sh -
```

## After the clone

### Create a new run

The person starting the a run creates is before the agent builds it. From the repository root:

```
./scripts/new-run.sh 01
```

That copies `template/` to `run-01/` and runs `make setup` there.

### Initialize an existing run

Open a run that already exists and set it up:

```
cd run-01
make setup
```

Running `make setup` again rebuilds the database.

To look at the run and start the app:

```
cd run-01
make dev
```

Open http://localhost:3001. The port is 3000 plus the run number. To create another run, pick a free number from the table below.

## Database

`make setup` reads the **Seed** line of that run's brief, writes the CSV files under `.data/seed/`, and loads them into `.data/app.sqlite`. Node 22 includes SQLite, so setup does not install a database. `.data/` is gitignored.

A brief may also store documents, or Postgres in-process (PGlite). Those files live in the run, outside `.data/`, so they are committed. `AGENTS.md` describes the tables.

This repository does not run a database server. A brief that needs Postgres, MySQL, MongoDB, or any other database in its own process is not built here. The agent stops and says so.

## Runs

| Run | Brief | Seed | Question |
|---|---|---|---|
| run-01 | fast-01-create-and-close | 100 | how few steps from a title to done |
| run-02 | fast-02-storage-sql | 10,000 | the data model as tables, ten queries timed |
| run-03 | fast-03-storage-document | 10,000 | the same model and queries as documents |
| run-04 | fast-04-one-item-many-views | 100 | list, board, calendar on one shared store |
| run-05 | fast-05-gantt-variants | 100 | gantt by hierarchy, by contributor, by blocker chain, and filtering |
| run-06 | fast-06-zoom-interface | 100 | zoom into items, notebook tabs, Ctrl+P (the interface idea from the 29 Oct notes) |
| run-07 | fast-07-nesting-displays | 100 | outline, drill-down, nested boxes, columns for one deep tree |
| run-08 | fast-08-relationship-graph | 100 | one item's neighbourhood as a graph and a mind map |
| run-09 | fast-09-widget-dashboard | 100 | widgets on a grid, a morning screen, per space and per person |
| run-10 | fast-10-space-and-members | 100 | sign-up, a space, members, two policies, a shared task |
| run-11 | proper-01-data-model-and-storage | 10,000 | the model and storage to build on |
| run-12 | proper-02-space-boundary | 100 | the space with policies as the security boundary |
| run-13 | proper-03-content-relations | 100 | related items by text and by embeddings, kept in scope |
| run-14 | proper-04-lerch-shell | 100 | the application frame that views and widgets live in |

The proper briefs have a "Findings from earlier runs" section. Fill it in by hand before starting the run. An agent does not open another run to fill it.

## Where the ideas went

| Idea | Brief |
|---|---|
| data modelling | fast-02, fast-03, then proper-01 |
| SQL or NoSQL and how it changes the code | fast-02 and fast-03 share one query set, so their docs/NOTES.md compare |
| efficient retrieval on 10,000 tasks | the query set in fast-02, fast-03, and proper-01 |
| creating a space and users, assignment, interaction | fast-10, then proper-02 |
| user journeys: create and close a task | fast-01 |
| a task in different views (calendar, list, board) | fast-04 |
| mind map | fast-08, as a second layout of the graph |
| charts | fast-09, as dashboard widgets |
| gantt variants and filtering | fast-05 |
| the interface idea | fast-06, then proper-04 |
| dashboard and interface options | fast-09, then proper-04 |
| nesting and how to display it | fast-07 (and the zoom in fast-06) |
| relationships and links, shown visually | fast-08 |
| embeddings | proper-03 only. A local model and an evaluation set do not fit one session |
| what a space is and how to implement it | fast-10, then proper-02 |
