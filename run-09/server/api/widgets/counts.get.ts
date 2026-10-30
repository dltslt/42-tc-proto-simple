// GET /api/widgets/counts?space=org-a&by=column|state
// Counts items per kanban column (in column position order) or per state.
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const space = String(query.space || 'org-a')
  const by = query.by === 'state' ? 'state' : 'column'
  const db = useDatabase()

  if (by === 'state') {
    const { rows } = await db.sql`
      SELECT state AS label, state, COUNT(*) AS count
      FROM tasks
      WHERE space = ${space}
      GROUP BY state
    `
    const map = new Map((rows as Array<Record<string, unknown>>).map(r => [String(r.state), Number(r.count)]))
    const states = ['unstarted', 'started', 'done']
    return {
      space,
      by,
      bars: states.map(s => ({ label: s, state: s, count: map.get(s) || 0 }))
    }
  }

  const { rows } = await db.sql`
    SELECT
      c.name AS label,
      c.state AS state,
      CAST(c.position AS INTEGER) AS position,
      COUNT(t.id) AS count
    FROM columns c
    LEFT JOIN tasks t ON t.space = c.space AND t.kanban = c.name
    WHERE c.space = ${space}
    GROUP BY c.name, c.state, c.position
    ORDER BY CAST(c.position AS INTEGER) ASC
  `

  return {
    space,
    by,
    bars: (rows as Array<Record<string, unknown>>).map(r => ({
      label: String(r.label),
      state: String(r.state),
      count: Number(r.count)
    }))
  }
})
