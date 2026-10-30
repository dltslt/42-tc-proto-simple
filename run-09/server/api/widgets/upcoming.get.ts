// GET /api/widgets/upcoming?space=org-a&days=7
// Items scheduled in the next N days (default 7). Also returns the nearest
// future scheduled items so a sparse 7-day window still shows what is coming next.
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const space = String(query.space || 'org-a')
  const days = Math.min(90, Math.max(1, Number(query.days) || 7))
  const db = useDatabase()

  const now = new Date()
  now.setUTCHours(0, 0, 0, 0)
  const startIso = unshifted(now.getTime())
  const endIso = unshifted(now.getTime() + days * 86_400_000)

  const { rows: inWindow } = await db.sql`
    SELECT id, level, title, kanban, state, lead, effort, scheduled_time
    FROM tasks
    WHERE space = ${space}
      AND scheduled_time != ''
      AND scheduled_time >= ${startIso}
      AND scheduled_time <= ${endIso}
    ORDER BY scheduled_time ASC
  `

  const { rows: nextUp } = await db.sql`
    SELECT id, level, title, kanban, state, lead, effort, scheduled_time
    FROM tasks
    WHERE space = ${space}
      AND scheduled_time != ''
      AND scheduled_time > ${startIso}
    ORDER BY scheduled_time ASC
    LIMIT 6
  `

  const shiftRow = (r: Record<string, string>) => ({
    ...r,
    scheduled_time: shifted(r.scheduled_time || '')
  })

  return {
    space,
    days,
    items: (inWindow as Array<Record<string, string>>).map(shiftRow),
    nearest: (nextUp as Array<Record<string, string>>).map(shiftRow)
  }
})
