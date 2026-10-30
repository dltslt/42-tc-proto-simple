# Lerch prototype

This repository is `tc-proto-simple`. It holds the Lerch prototypes. An agent starts at this root. The prompt names one run directory and one file in `briefs/`.

Lerch is a task and project tool built for a team first. It is a hub for the next relevant piece of work: it stays out of the way, and an ordinary change takes the fewest steps. The core is items, their relations, and a space.

A prototype is a lesson. The readers learned software engineering in the 42 curriculum, in C and C++. They are learning Nuxt, Vue, and the modules this run actually uses. Write the code, the comments, and the docs so a student can read the run and see how the framework works.

```
.
├── AGENTS.md
├── README.md
├── PROMPT.md
├── briefs/
├── scripts/
├── spec/
├── template/
└── run-*/  
```

`template/` is the Nuxt app. `run-*/` is a copy of `template/` and then the code that run writes. A run does not contain `AGENTS.md`, `README.md`, `PROMPT.md`, `briefs/`, `scripts/`, or `spec/`.

## Before you write code

Read these, in this order:

1. This file.
2. `spec/short-agents-v1.md`: the product context. Where it and this file disagree on product behaviour, the spec wins.
3. The brief the prompt names, under `briefs/`. Where it and this file disagree, the brief wins, except the database-server rule below. That rule wins over the brief.

All three are at this root.

The run directory the prompt names already exists. Do not run `scripts/new-run.sh` or `make setup`.

CRITICAL: If the brief needs a database server (its own process, such as Postgres, MySQL, or MongoDB), STOP before writing code. Warn the user that this brief is not meant to be built in the Docker-free repository. Do not install the server, do not start it, and do not replace it with SQLite.

Write code only inside the run directory the prompt names. Do not edit `template/`, `briefs/`, `spec/`, `scripts/`, `AGENTS.md`, `README.md`, or `PROMPT.md`.

Do not list, read, search, or diff any other `run-*` directory. Search only inside the named run. An empty "Findings from earlier runs" section in a brief stays empty. Do not open another run to fill it.

## The database

`make setup` has already built it. Do not run `make setup`. The file is `<run>/.data/app.sqlite`. Do not run the seed script. Do not write a loader for this file. `.data/` is gitignored and the next `make setup` replaces it. Do not put any other stored data there. A document store, a PGlite directory, a second database, or an export lives in the run, outside `.data/`, so it is committed.

`scripts/schema.sql` is the schema. One table per seed file:

| Table | What a row is |
|---|---|
| `actors` | a person or an agent. `spaces` lists the spaces, separated by `;` |
| `spaces` | an organisation space or a personal space |
| `members` | one actor in one space, with a role |
| `columns` | a kanban column in one space. `position` is its order. `state` is the category of that column |
| `tasks` | one item. `level` is project, epic, story, task, or subtask. `contributors` is a `;` list. `lead` may be empty |
| `relations` | one parent and one child. This is the hierarchy record |
| `tags` | one of 40 tags |
| `item_tags` | one tag on one item |
| `blockers` | one blocker link. `blocker_item_id` blocks `blocked_item_id` |
| `artifacts` | a title and a URL. Never a copy of the document |
| `item_artifacts` | one artifact on one item |
| `events` | one event on one item. Each item has 2 to 4 |

`tasks.parent_id` repeats `relations`. An item with no parent has an empty `parent_id`. `tasks.state` follows `tasks.kanban` through `columns`. The two cannot disagree.

Timestamps are offsets from `2026-10-30T00:00:00Z`. A read that wants "today" shifts every timestamp by the gap between that day and the day it reads.

The Dinner fixture is in the 10,000-item database and not in the 100-item database: project "Dinner" with task "cut the bread", project "Buy cutlery" with task "bread knife", and a blocker from "bread knife" to "cut the bread" with severity `cannot do anything`. Both tasks then have effort and a scheduled time. If a brief needs that example and this database lacks it, add it outside `.data/` and list it in `docs/NOTES.md`.

Severity values: `cannot do anything`, `will be stuck`, `slowed down`, `nice to have`. They are on `blockers`. Item score values: `doesn't work`, `bare minimum`, `satisfactory`, `excellent`. They are not in the database. These are two different scales. Never merge them.

## Stack

The team has chosen Nuxt. Everything below is an assumption for this run only. Name it in `docs/NOTES.md`, because it is not a team decision.

- **Server:** Nuxt server routes (`server/api/`). No separate backend.
- **Installer:** pnpm. The user already ran `make setup` before the session. It installed dependencies and built `.data/app.sqlite`. It does not start the server.
- **SQL storage (default):** the SQLite file `make setup` built. Read it through Nitro's built-in database layer (db0) with the `node-sqlite` connector. Node 22 ships `node:sqlite`, so nothing needs compiling. If it gets in the way, `better-sqlite3` is fine; say so.
- **In-process engines a brief may name:** `better-sqlite3` when `node:sqlite` gets in the way, and PGlite. A PGlite directory stays in the run, outside `.data/`, so it is committed. A database server is the abort in "Before you write code".
- **Document storage:** Nitro's key-value storage (`useStorage`, unstorage) with the `fs` driver. Only when the brief asks for it. The files stay in the run, outside `.data/`, so they are committed.
- **Interface:** plain Vue components and hand-written CSS. No UI kit, no CSS framework. A brief may allow one library for a hard part; name it.
- **Identity:** no login unless the brief asks. A "current user" picker in the header sets the acting person, and the server reads it from a header or cookie. That stub lives in one module.

## Product stubs

Keep each of these in one named place (a config file or one module), so an answer can replace it:

- the policy check `can(actor, action, resource)`, allowing everything unless the brief says otherwise
- the ordering of "what to show next" (name the ordering you used)
- where a new item goes before it has a column (default: the first `unstarted` column)

## Kinds of brief

- **fast:** one session. Aim for about an hour. A working slice beats a complete one. When time runs short, cut product scope and write down what was cut. Do not cut the comments or the short docs. No tests are required.
- **proper:** several sessions. Storage, server routes, and interface are separate layers. The important paths have tests. The comments and the docs are how the team reads the code.

## Comments

Comment a line when it uses a framework feature or a language concept a C or C++ student would not already know. The comment says what that feature does here, in a few words.

Comment these when you use them: a Nuxt auto-import, a file under `server/api` becoming a URL, `ref` and `computed`, a composable, `useFetch`, Nitro storage, `async` and `await`.

Do not comment `if`, loops, or ordinary calls.

## Docs

Create `docs/` inside the run directory. `scripts/new-run.sh` does not create it. Keep every file short enough to read in one sitting. Commit each file with the chunk it belongs to, and update it if the design changes.

- `docs/design.md`. A few sentences on what the run is. One simple mermaid diagram of the chosen design: the page, the server route, storage, and a module when the run uses one; how an action moves through them; which Nuxt features are in use. A second diagram only when one picture cannot show both the screen and the data.
- `docs/frontend.md` and `docs/backend.md`. The architecture in plain language, one side each. Nuxt is one app. The split is so a student can read the interface and the server separately. Name the real modules and files.
- Further markdown files in `docs/` when the run does something a student should see explained, such as a storage choice, a query set, or a view. Do not add a file that only repeats the code.

## Who wrote the run

At the run root, write one file named `<harness>-<model>` for the harness and model that built the prototype. An example name is `cursor-grok-4.7`. One line inside repeats that pair. A model that only planned the steps is not in this name. Write the file once, when you start building.

## Skills

- `conventional-commit-message` (`.agents/skills/conventional-commit-message/SKILL.md`) is how a commit message is written. The type in the git workflow below comes from that skill.
- `modern-web-guidance` (`.agents/skills/modern-web-guidance/SKILL.md`) is for HTML, CSS, and client-side JS. Search, then retrieve, with `pnpm dlx modern-web-guidance@latest`.

## Workflow

1. Split the slice into chunks a reviewer can read as one idea. Write the list down before coding.
2. When you start building, write the authorship file at the run root. It names the harness and model that build the prototype.
3. Build chunk by chunk. Comment framework features and language concepts as you write them. Commit each chunk with the git workflow below. A later correction is its own commit.
4. Write `docs/design.md`, `docs/frontend.md`, and `docs/backend.md` when the design and the two sides exist. Update them if the design changes. Add another file in `docs/` when the run does something a student should see explained. Commit these with the chunk they belong to.

6. Check every item under "Done when" in the brief yourself, in the browser.
7. Write `docs/NOTES.md`, commit it, and repeat its summary in your final message.

## Git workflow

There is one repository and one branch, `main`. Runs are directories in that checkout. Do not create a repository inside a run, do not use branches, and do not use worktrees.

Commit only your own run directory. The commit message scope is that directory's name. The message below is the pattern, not a message to copy:

```text
git add <run-directory>
git commit -m "<type>(<run-directory>,<scope>): <what this chunk does>" -- <run-directory>
```

For a run in `run-06` the commands look like this:

```text
git add run-06
git commit -m "feat(run-06,ui): <what this chunk does>" -- run-06
```

`git add` puts that directory into the staging area. The path after `--` tells the commit to record only that directory, so files another agent already staged are left out. The path is not stored in the commit. The log shows the message only. `git log -- <run-directory>`, run later, filters history to commits that touched that directory.

Never run `git add -A`, `git add .`, or `git commit` with no path. Those take the whole staging area and can mix two runs into one commit.

If the commit fails because the index lock is held, run the same commit command again. A commit that touches only its own run directory does not conflict with another run.

## docs/NOTES.md

Write `docs/NOTES.md`. A brief that says `NOTES.md` means this file. The first lines name who built the run, before the sections below. `Built by` is the harness and model that wrote the code, the same pair as the file at the run root. Add `Planned by` on its own line only when a planning model was used. That model is not the one named in the authorship file. Omit the line when there was no planning model.

```text
Built by: cursor, grok-4.7
Planned by: cursor, <model>
```

Then these sections, in this order. Keep them short:

1. **Run:** the brief, the port, and how to start it. `make dev` starts the server.
2. **What it shows:** two or three sentences a teammate can read without opening the code.
3. **Open questions touched:** each open question from the spec this run touched, and what the run suggests. Do not claim a product decision.
4. **Added:** every field, record, value, fixture, or behaviour that is not in the spec.
5. **Stack assumptions:** storage, libraries, anything a later run should not take as decided.
6. **Cut:** what the brief asked for and the run did not do.
7. **Numbers:** any measurements the brief asked for, with the machine noted (for example "laptop, dev server").
