// GET /api/q5?actor=person-1 — one person's open items across their spaces.
export default defineEventHandler((event) => {
  const q = getQuery(event)
  const actor = String(q.actor ?? 'person-1')
  return runBench(5, "one person's open items, every space they are a member of", () => q5PersonOpen(useSqlite(), actor))
})
