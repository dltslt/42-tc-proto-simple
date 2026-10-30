# fast-05: gantt variants

**Kind:** fast
**Seed:** 100 items
**Question:** which gantt chart shows the work we are watching, and how does filtering decide what lands on it?

## Scenario

A lead in an organisation space wants to see the next three months. They try three cuts of the same items and filter each one down until it is readable.

## Build

Draw the bars yourself (CSS grid or SVG). No chart library. A bar runs from the scheduled start for its effort. Items without a scheduled time are listed beside the chart, not drawn.

Three variants of the same chart, as tabs:

1. **By hierarchy:** rows are the tree of one project (project, epics, stories, tasks), collapsible. A parent's bar spans its children.
2. **By contributor:** one row per person or agent, their items as bars on that row. Overlaps on one row are visible (no clash prompt, just the overlap).
3. **By blocker chain:** rows follow blockers. A blocked item sits below its blocker, with an arrow between the bars, coloured by severity.

Filters shared by the three: space, project, contributor, state, tag, and a date range. Show how many items the filter dropped and why (for example "31 without a scheduled time").

Add the "cut the bread" example from the spec as a fixture if the seed lacks it: a project "Dinner" with a task "cut the bread", a project "Buy cutlery" with a task "bread knife", and a blocker from "bread knife" to "cut the bread" with the severity `cannot do anything`. Both tasks need a scheduled time.

## Done when

- All three variants draw from the same filtered set.
- The count of dropped items is shown, with the reason.
- The "cut the bread" example shows the bread knife bar before the cut-the-bread bar, joined by a severity-coloured arrow.

## Out of scope

Dragging bars to reschedule. Critical-path calculation. Due dates and priorities (OPEN in the spec).

## Touches

Scheduling (PROPOSED: effort and scheduled time). Whether blocker, dependency, and calendar clash are one mechanism (OPEN): variants 2 and 3 show both side by side.
