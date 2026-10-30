# proper-04: the Lerch shell

**Kind:** proper
**Seed:** 100 items
**Question:** what is the skeleton of the application that every view, action, and widget lives in?

## Team notes

From the team's notes of 29 October, quoted as written:

> a default 'view' can just be something that "zoomes" into an item. where i can simple also create a new item, see a kanban view, have some edit options.. perhaps as some tiles i can focus on
>
> keep design clear. use a notebook label layout (registerkarten) as vertical or horizontal tabs to show these "zoom" layers and/or focused views.
>
> fancy animation are an option, can be toggled off.
>
> a project view would then just be a dedicated entry point and "view level"
>
> **totally** need a *control pane*, something like `ctrl + p` to reach commands and quick switches
>
> open every morning and see
>
> - critical items (priority, due date etc.)
> - last viewed or modified items
>
> is the "base interface" also a view? how the app itself is build; some skeleton that then offers to go to views and do actions, start and use features...

## Findings from earlier runs

(Filled in by hand before this run starts. If empty, ignore.)

## Scenario

A member opens Lerch in the morning, sees their widgets, zooms into a project, switches its children between list, board, calendar, and gantt, creates and closes a task, and reaches anything with Ctrl+P, all without leaving one frame.

## Build

- One frame: the zoom path as notebook tabs (Registerkarten), the command pane, the space switcher, and a content area.
- **Zoom:** every item level is a layer showing its children, a new-item input, and the item's own fields. Zooming in replaces the layer; a tab per level zooms back out.
- **Views** as interchangeable parts of the content area. A view is described by its three choices (which items, how drawn, which action is primary), so a new view is a new description plus a renderer. Build list, board, calendar, and gantt.
- **Widgets on a grid** at the outermost level. The layout is stored per space (the default) and per person (their own copy once they change it).
- **One client-side store** that every view and widget reads. No view keeps its own copy, so a change in one shows in all.
- Storage, server routes, and interface as separate layers. The interface only calls the server routes.
- Keyboard first: every action reachable from the command pane, and shortcuts for the ordinary ones (new item, next column, close, zoom in and out).
- Animations behind one toggle, off under `prefers-reduced-motion`.
- Tests for the store and for the command pane's search.

## Done when

- The scenario above runs without a page reload.
- Adding a fifth view takes one new file and one entry in a list.
- NOTES.md proposes an answer to "what is a view made of", based on what this run needed.

## Out of scope

Mobile layout. Real sign-in.

## Touches

What a view is made of (OPEN). What you open every morning (OPEN). How a space offers widgets (OPEN). Whether the base interface is itself a view (raised in the notes).
