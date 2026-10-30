// GET /api/dbinfo — which file the bench is reading and how big it is.
// The page shows this so a 10k and a 100k run are never confused.
export default defineEventHandler(async () => {
  const db = useSqlite()
  const row = await db.prepare('SELECT count(*) AS tasks FROM tasks').get()
  return { path: DB_PATH, tasks: Number((row as Record<string, unknown>).tasks) }
})
