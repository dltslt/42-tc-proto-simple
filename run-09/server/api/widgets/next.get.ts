// GET /api/widgets/next?space=org-a
// Returns the current actor's items that are not done, ordered by the stub in
// server/utils/ordering.ts.
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const space = String(query.space || 'org-a')
  const actor = currentActor(event)
  const db = useDatabase()

  // Contributors is a `;`-separated string in the schema, so we wrap both sides
  // in `;` to match whole actor IDs (so `person-1` never matches `person-10`).
  const token = `;${actor};`
  const stmt = db.prepare(`
    SELECT id, level, title, kanban, state, lead, contributors, effort, scheduled_time
    FROM tasks
    WHERE space = ?
      AND state != 'done'
      AND (lead = ? OR (';' || contributors || ';') LIKE '%' || ? || '%')
    ORDER BY ${NEXT_ORDER_BY}
  `)
  const rows = (await stmt.all(space, actor, token)) as Array<Record<string, string>>

  return {
    actor,
    ordering: NEXT_ORDERING_NAME,
    items: rows.map(r => ({
      ...r,
      scheduled_time: shifted(r.scheduled_time || '')
    }))
  }
})
