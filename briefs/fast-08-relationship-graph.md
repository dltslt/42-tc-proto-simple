# fast-08: the relationship graph

**Kind:** fast
**Seed:** 100 items
**Question:** what does an item's neighbourhood look like when parent and child, tags, blockers, and artifacts are drawn as one picture?

## Scenario

A member opens "cut the bread" and sees why it is stuck: the graph shows "bread knife" in another project blocking it, and the projects both sit under. They step to a neighbour and the graph re-centres.

Add the "cut the bread" example from the spec as a fixture if the seed lacks it: a project "Dinner" with a task "cut the bread", a project "Buy cutlery" with a task "bread knife", and a blocker from "bread knife" to "cut the bread" with the severity `cannot do anything`.

## Build

- A graph around one focused item, 1 or 2 hops out (a switch). The whole space is never drawn at once.
- Edge kinds, each with its own style and a legend: parent and child, blocker (coloured by severity, with a direction), shared tag, artifact (an artifact is a node too, and leads back to every item that links it).
- A toggle per edge kind, and a limit on how many shared-tag neighbours appear (tags connect many items).
- Clicking a node re-centres on it. A side panel shows the item's fields.
- A **mind map** layout of the same data as a second tab: the focused item in the middle, children around it, radial. No other edge kinds.
- One graph layout library is allowed (for example a force layout). Name it. Hand-rolled SVG is also fine.

## Done when

- "cut the bread" shows "bread knife" as its blocker, with the severity `cannot do anything`, and the two projects.
- An artifact node linked from several items shows all of them.
- With shared tags on and no limit, the graph shows why a limit is needed. With the limit on, it is readable.

## Out of scope

Similarity and embeddings. Editing relations in the graph.

## Touches

Which content connections belong (OPEN). Tags as connectors (PROPOSED). NOTES.md says what the tag edges showed: useful, or noise.
