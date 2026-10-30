# Standard prompt for a prototype run

Open a new agent chat at the root of this repository and send the block below. Change the two values. Nothing else changes between runs.

- `RUN` is the run directory (`run-02`). The server port is 3000 plus that number.
- `BRIEF` is a file in `briefs/` (`briefs/fast-02-storage-sql.md`).

**THIS IS THE PROMPT:**

```text
RUN = run-02
BRIEF = briefs/fast-02-storage-sql.md

Build the prototype that AGENTS.md describes for this RUN and BRIEF.
```

One chat builds one run. The brief says what to build. `AGENTS.md` is the rule for every run.
