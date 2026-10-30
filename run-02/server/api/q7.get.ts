// GET /api/q7?tag=Valve — items with one tag, plus counts of their other tags.
export default defineEventHandler((event) => {
  const q = getQuery(event)
  const tag = String(q.tag ?? 'Valve')
  return runBench(7, 'items with a tag, and their other tags counted', () => q7Tag(useSqlite(), tag))
})
