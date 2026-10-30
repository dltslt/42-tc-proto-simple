// GET /api/spaces/:id/members — who is in the space. The contributor
// checkboxes in the item detail come from here.
import { all, get } from '../../../utils/db'
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

  return await all(`
    SELECT a.id, a.name, m.role
      FROM members m JOIN actors a ON a.id = m.actor_id
     WHERE m.space = ?
     ORDER BY a.name
  `, [space])
})
