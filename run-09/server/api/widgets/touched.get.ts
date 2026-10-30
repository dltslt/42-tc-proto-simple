// GET /api/widgets/touched?space=org-a&limit=8
// Items the current actor changed most recently, derived from the events table.
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const space = String(query.space || 'org-a')
  const limit = Math.min(25, Math.max(1, Number(query.limit) || 8))
  const actor = currentActor(event)
  const db = useDatabase()

  const stmt = db.prepare(`
    SELECT
      t.id,
      t.level,
      t.title,
      t.kanban,
      t.state,
      MAX(e.at) AS last_at,
      (
        SELECT e2.kind || CASE WHEN e2.detail != '' THEN ': ' || e2.detail ELSE '' END
        FROM events e2
        WHERE e2.item_id = t.id AND e2.actor_id = ?
        ORDER BY e2.at DESC
        LIMIT 1
      ) AS last_action
    FROM events e
    JOIN tasks t ON t.id = e.item_id
    WHERE t.space = ? AND e.actor_id = ?
    GROUP BY t.id
    ORDER BY last_at DESC
    LIMIT ?
  `)
  const rows = (await stmt.all(actor, space, actor, limit)) as Array<Record<string, string>>

  return {
    space,
    actor,
    items: rows.map(r => ({
      ...r,
      last_at: shifted(r.last_at || '')
    }))
  }
})
