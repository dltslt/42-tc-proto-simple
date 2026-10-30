// GET /api/q10?word=valve — title search, first 20 hits.
export default defineEventHandler((event) => {
  const q = getQuery(event)
  const word = String(q.word ?? 'valve')
  return runBench(10, 'title search, first 20 hits', () => q10Search(useSqlite(), word))
})
