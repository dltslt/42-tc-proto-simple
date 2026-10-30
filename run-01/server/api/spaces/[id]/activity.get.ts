// GET /api/spaces/:id/activity — the events the *other* members wrote.
// This is passive communication: nobody sends a message, moving a column or
// editing a field already is the message. The panel polls this route.
import { all, get } from '../../../utils/db'
import { can } from '../../../utils/stubs'
import { currentUserId } from '../../../utils/current-user'
import { toRealTime } from '../../../utils/spec-time'

export default defineEventHandler(async (event) => {
  const space = getRouterParam(event, 'id')
  const actorId = await currentUserId(event)

  if (!(await can(actorId ?? '', 'read', `space:${space}`))) {
    throw createError({ statusCode: 403, statusMessage: 'Not allowed' })
  }
  if (!(await get('SELECT id FROM spaces WHERE id = ?', [space]))) {
    throw createError({ statusCode: 404, statusMessage: 'No such space' })
  }

  // Events on the space's items, excluding the current user's own, newest
  // first, capped for the panel.
  const rows = await all(`
    SELECT e.id, e.at, e.kind, e.detail, e.actor_id, e.item_id,
           a.name AS actorName, t.title AS itemTitle
      FROM events e
      JOIN tasks t ON t.id = e.item_id
      JOIN actors a ON a.id = e.actor_id
     WHERE t.space = ? AND e.actor_id != ?
     ORDER BY e.at DESC, e.id DESC
     LIMIT 30
  `, [space, actorId ?? ''])

  return rows.map(e => ({
    id: e.id,
    at: toRealTime(e.at),
    actor: e.actorName,
    itemId: e.item_id,
    itemTitle: e.itemTitle,
    kind: e.kind,
    detail: e.detail,
  }))
})
