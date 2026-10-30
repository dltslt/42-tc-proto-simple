// GET /api/items/:id — one item with its tags and its event log.
import { all, get } from '../../utils/db'
import { itemTags, shapeItem, type ItemRow } from '../../utils/items'
import { can } from '../../utils/stubs'
import { currentUserId } from '../../utils/current-user'
import { toRealTime } from '../../utils/spec-time'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const actorId = await currentUserId(event)

  const row = await get<ItemRow & { columnState: string }>(
    `SELECT t.*, c.state AS columnState
       FROM tasks t JOIN columns c ON c.space = t.space AND c.name = t.kanban
      WHERE t.id = ?`,
    [id],
  )
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'No such item' })
  }

  if (!(await can(actorId ?? '', 'read', `item:${id}`))) {
    throw createError({ statusCode: 403, statusMessage: 'Not allowed' })
  }

  const events = await all(`
    SELECT e.*, a.name AS actorName
      FROM events e JOIN actors a ON a.id = e.actor_id
     WHERE e.item_id = ?
     ORDER BY e.at DESC, e.id DESC
  `, [id])

  return {
    ...shapeItem(row, await itemTags(id)),
    events: events.map(e => ({
      id: e.id,
      // Stored on the seed's calendar; shown on the real one.
      at: toRealTime(e.at),
      actor: e.actorName,
      kind: e.kind,
      detail: e.detail,
    })),
  }
})
