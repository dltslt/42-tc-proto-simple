// GET /api/q1?space=org-a&kanban=backlog&page=0
// A file under server/api/ becomes a URL; `.get` in the name limits it to
// GET requests. defineEventHandler and getQuery are Nitro auto-imports.
export default defineEventHandler((event) => {
  const q = getQuery(event)
  const space = String(q.space ?? 'org-a')
  const kanban = String(q.kanban ?? 'backlog')
  const page = Number(q.page ?? 0)
  return runBench(1, 'column page, newest change first', () => q1ColumnPage(useSqlite(), space, kanban, page))
})
