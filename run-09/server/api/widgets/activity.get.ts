// GET /api/widgets/activity?space=org-a&limit=10
// Recent events on items in the space, newest first.
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const space = String(query.space || 'org-a')
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 10))
  const db = useDatabase()

  const stmt = db.prepare(`
    SELECT
      e.id,
      e.item_id,
      e.at,
      e.actor_id,
      COALESCE(a.name, e.actor_id) AS actor_name,
      e.kind,
      e.detail,
      t.title AS item_title,
      t.level AS item_level
    FROM events e
    JOIN tasks t ON t.id = e.item_id
    LEFT JOIN actors a ON a.id = e.actor_id
    WHERE t.space = ?
    ORDER BY e.at DESC
    LIMIT ?
  `)
  const rows = (await stmt.all(space, limit)) as Array<Record<string, string>>

  return {
    space,
    events: rows.map(r => ({
      ...r,
      at: shifted(r.at || '')
    }))
  }
})
