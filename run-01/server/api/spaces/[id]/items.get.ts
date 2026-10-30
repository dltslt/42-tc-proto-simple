// A file under `server/api/` becomes a URL: this one answers
// GET /api/spaces/:id/items — the space's items, newest created first.
// Every route starts the same way: read the acting person from the header,
// pass the (allow-all) policy, then query.
import { get } from '../../../utils/db'
import { listItems, itemTags, shapeItem } from '../../../utils/items'
import { can } from '../../../utils/stubs'
import { currentUserId } from '../../../utils/current-user'

export default defineEventHandler(async (event) => {
  const space = getRouterParam(event, 'id')
  const actorId = await currentUserId(event)

  if (!(await can(actorId ?? '', 'read', `space:${space}`))) {
    throw createError({ statusCode: 403, statusMessage: 'Not allowed' })
  }
  if (!(await get('SELECT id FROM spaces WHERE id = ?', [space]))) {
    throw createError({ statusCode: 404, statusMessage: 'No such space' })
  }

  // One query per item for its tags. Fine at prototype scale; a grouped join
  // would be the next step.
  const rows = await listItems(space)
  return await Promise.all(rows.map(async row => shapeItem(row, await itemTags(row.id))))
})
