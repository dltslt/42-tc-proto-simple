// GET /api/q3?id=item-1 — the whole subtree under one project, all levels.
export default defineEventHandler((event) => {
  const q = getQuery(event)
  const id = String(q.id ?? 'item-1')
  return runBench(3, 'project subtree, all levels', () => q3Subtree(useSqlite(), id))
})
