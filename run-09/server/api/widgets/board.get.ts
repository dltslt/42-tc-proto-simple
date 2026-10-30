// GET /api/widgets/board?space=org-a&level=task
// Small kanban board for one hierarchy level, with optional "only mine" filter.
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const space = String(query.space || 'org-a')
  const level = String(query.level || 'task')
  const onlyMine = query.mine === '1'
  const actor = currentActor(event)
  const db = useDatabase()

  const { rows: columns } = await db.sql`
    SELECT name, state, CAST(position AS INTEGER) AS position
    FROM columns
    WHERE space = ${space}
    ORDER BY CAST(position AS INTEGER) ASC
  `

  const { rows: rawItems } = await db.sql`
    SELECT id, level, title, kanban, state, lead, contributors, effort
    FROM tasks
    WHERE space = ${space} AND level = ${level}
    ORDER BY id ASC
  `

  const token = `;${actor};`
  const items = (rawItems as Array<Record<string, string>>).filter(item => {
    if (!onlyMine) return true
    return item.lead === actor || `;${item.contributors};`.includes(token)
  })

  return { space, level, onlyMine, columns, items }
})
