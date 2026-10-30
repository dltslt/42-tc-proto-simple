// GET /api/widgets/blockers?space=org-a
// Open blockers in the space, grouped by the spec's four severity levels.
const SEVERITIES = [
  'cannot do anything',
  'will be stuck',
  'slowed down',
  'nice to have'
] as const

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const space = String(query.space || 'org-a')
  const includeDone = query.includeDone === '1'
  const db = useDatabase()

  const { rows } = await db.sql`
    SELECT
      b.id,
      b.severity,
      b.blocker_item_id,
      blocker.title AS blocker_title,
      blocker.state AS blocker_state,
      blocker.kanban AS blocker_kanban,
      b.blocked_item_id,
      blocked.title AS blocked_title,
      blocked.state AS blocked_state,
      blocked.kanban AS blocked_kanban
    FROM blockers b
    JOIN tasks blocker ON blocker.id = b.blocker_item_id
    JOIN tasks blocked ON blocked.id = b.blocked_item_id
    WHERE blocked.space = ${space}
  `

  const list = (rows as Array<Record<string, string>>).filter(
    r => includeDone || r.blocked_state !== 'done'
  )

  const groups = SEVERITIES.map(severity => ({
    severity,
    items: list.filter(r => r.severity === severity)
  }))

  return { space, groups, total: list.length }
})
