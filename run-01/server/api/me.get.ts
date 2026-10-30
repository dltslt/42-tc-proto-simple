// GET /api/me — the spaces the current user belongs to. The header picker
// uses this to offer spaces and to remember who is acting. The `spaces`
// column on an actor is a `;` list of `spaceId:role` pairs, so the route
// splits it and joins the names from the spaces table.
import { all, get } from '../utils/db'
import { currentUserId } from '../utils/current-user'

export default defineEventHandler(async (event) => {
  const actorId = await currentUserId(event)
  if (!actorId) return { id: undefined, name: undefined, spaces: [] }

  const actor = await get<{ id: string, name: string, spaces: string }>(
    'SELECT id, name, spaces FROM actors WHERE id = ?',
    [actorId],
  )
  if (!actor) return { id: undefined, name: undefined, spaces: [] }

  // 'personal-1:admin;org-a:admin' -> the ids, then one name query each.
  const spaceIds = actor.spaces.split(';').map(pair => pair.split(':')[0])
  const spaces = await all<{ id: string, name: string, kind: string }>(
    `SELECT id, name, kind FROM spaces WHERE id IN (${spaceIds.map(() => '?').join(',') || "''"})`,
    spaceIds,
  )
  return { id: actor.id, name: actor.name, spaces }
})
