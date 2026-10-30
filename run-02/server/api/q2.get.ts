// GET /api/q2?id=item-1351 — the item panel: one item and everything on it.
export default defineEventHandler((event) => {
  const q = getQuery(event)
  const id = String(q.id ?? 'item-1351')
  return runBench(2, 'item panel: children, parent chain, tags, artifacts, blockers', () => q2ItemPanel(useSqlite(), id))
})
