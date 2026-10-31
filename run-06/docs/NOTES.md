Built by: antigravity, gemini-3.8-flash

1. **Run:** Brief `briefs/fast-06-zoom-interface.md` on port 3006. Start the server with `make dev` inside `run-06` (or `PORT=3006 node .output/server/index.mjs`).

2. **What it shows:**
The entire workspace is experienced as zooming into an item. The space is the outermost layer; zooming in steps into a project, then an epic, story, and task, with notebook tabs (*Registerkarten*) maintaining context and one-click zoom-out. A keyboard-driven command pane (`Ctrl+P`) reaches any item at any depth, and layers smoothly morph via the View Transitions API or freeze completely when animations are toggled off.

3. **Open questions touched:**
- *What do you open every morning? (gold):* Suggests landing directly on the user's space as the root zoom layer, exposing immediate top-level projects and children without dashboard clutter.
- *What is a view made of? (OPEN):* Suggests that a view is a facet of an item layer: child tiles, a child kanban board, and the item's own fields coexist within the same zoom level.
- *Whether the base interface is itself a view (raised in notes):* Treating the space as the top-level zoom item confirms that the entire interface can operate recursively as a single zoom view.

4. **Added:**
- Space zoom target representation (`space:<spaceId>`) allowing uniform zoom layer handling for both spaces and items.
- Automatic hierarchy step-down mapping (`project` → `epic` → `story` → `task` → `subtask`) when creating children inside a layer.
- Quick path enrichment (`path: "Store the brush › Pack the shelf"`) in search results for fast disambiguation in `Ctrl+P`.
- `.no-animations` CSS overrides strictly turning off all transitions, animations, and view transition pseudo-elements when motion is disabled.

5. **Stack assumptions:**
- Node 22 built-in `node:sqlite` (`DatabaseSync`) for synchronous SQLite queries without native builds.
- Web Platform View Transitions API (`document.startViewTransition`) for layer transitions.
- Plain Vue 3 components and scoped CSS; no external component kits or utility CSS libraries.

6. **Cut:**
- Saving user layout preferences (out of scope per brief).
- Mobile swipe navigation gestures (out of scope per brief).
- Advanced fuzzy string metric ranking (simple multi-column SQL LIKE matching used for the 100-item seed).

7. **Numbers:**
- Build time: 6.05s via `pnpm exec nuxt build` on local Linux environment.
- API response latency: ~2ms for `/api/zoom` with 5-level ancestry traversal and child grouping.
- Zero-motion verification: 0 CSS transitions and 0 view transition animations active when motion toggle is OFF.
