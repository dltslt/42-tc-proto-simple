// GET /api/spaces/:id/columns — the space's kanban columns in board order.
// The interface needs them to compute "next column", "previous column" and
// "first done column" for the row gestures.
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

  // `position` is TEXT in the seed, so order numerically: CAST reads it as a
  // number (SQL's type conversion, the same idea as a C cast).
  return await all(
    'SELECT name, state FROM columns WHERE space = ? ORDER BY CAST(position AS INTEGER)',
    [space],
  )
})
