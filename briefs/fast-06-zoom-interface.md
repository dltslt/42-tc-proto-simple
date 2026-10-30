# fast-06: the zoom interface

**Kind:** fast
**Seed:** 100 items
**Question:** can the whole interface be "zoom into an item", with a command pane to get anywhere?

## Team notes

This brief builds the interface idea from the team's notes of 29 October, quoted as written:

> a default 'view' can just be something that "zoomes" into an item. where i can simple also create a new item, see a kanban view, have some edit options.. perhaps as some tiles i can focus on
>
> keep design clear. use a notebook label layout (registerkarten) as vertical or horizontal tabs to show these "zoom" layers and/or focused views.
>
> fancy animation are an option, can be toggled off.
>
> a project view would then just be a dedicated entry point and "view level"
>
> **totally** need a *control pane*, something like `ctrl + p` to reach commands and quick switches

## Scenario

A member opens Lerch and lands on their space as the outermost layer. They zoom into a project, then into an epic, and each level offers the same things: its children, a new-item input, a board of the children, and edit options for the item itself. Notebook tabs (Registerkarten) show the zoom path, so they can jump back out. Ctrl+P reaches any item or command without the mouse.

## Build

- **Zoom layer:** the current item fills the page, with tiles for its children, a new-item input that creates a child, a board of the children, and the item's own fields. Zooming into a child replaces the layer.
- **Notebook tabs:** one tab per level of the zoom path, vertical on a wide screen and horizontal on a narrow one. Clicking a tab zooms out to it. A project is just a level you can enter directly (an entry point).
- **Command pane (Ctrl+P):** fuzzy search over item titles and a list of commands (new item here, zoom out, switch view, switch space, toggle animations, go to item). Fully usable from the keyboard.
- **Animations:** a zoom transition between layers (the View Transitions API is a good fit; check the `modern-web-guidance` skill). A toggle switches them off, and `prefers-reduced-motion` switches them off by default.
- Keep the design clear: few colours, readable type, the tabs as the only chrome.

## Done when

- From the space, three zoom steps reach a task, and the tabs show the three levels.
- Ctrl+P, typing part of a title, and Enter opens that item at any depth.
- Creating a child from inside a layer takes a title and Enter.
- With animations off, nothing moves.

## Out of scope

Dashboard widgets. Mobile swipes. Saving a user's layout.

## Touches

What you open every morning (OPEN). What a view is made of (OPEN). Whether the base interface is itself a view (raised in the notes).
