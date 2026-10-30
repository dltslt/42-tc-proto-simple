// POST /api/spaces/:id/items — create an item from a title alone.
// The spec's rule: a title is the only field needed to create an item. The
// server fills in everything else, so the interface stays one input.
import { randomUUID } from 'node:crypto'
import { get, run } from '../../../utils/db'
import { firstColumnOfState, appendEvent } from '../../../utils/items'
import { can, NEW_ITEM_PLACEMENT } from '../../../utils/stubs'
import { currentUserId } from '../../../utils/current-user'

export default defineEventHandler(async (event) => {
  const space = getRouterParam(event, 'id')
  const actorId = await currentUserId(event)

  if (!(await can(actorId ?? '', 'create', `space:${space}`))) {
    throw createError({ statusCode: 403, statusMessage: 'Not allowed' })
  }

  const body = await readBody<{ title?: string }>(event)
  const title = (body?.title ?? '').trim()
  if (!title) {
    throw createError({ statusCode: 400, statusMessage: 'A title alone creates an item' })
  }

  // PRODUCT STUB in action: a fresh item lands in the space's first
  // `unstarted` column (NEW_ITEM_PLACEMENT), and its state is that column's.
  const column = await firstColumnOfState(space, 'unstarted')
  if (!column) {
    throw createError({ statusCode: 400, statusMessage: 'The space has no unstarted column' })
  }

  const id = `item-${randomUUID()}`
  await run(
    `INSERT INTO tasks
       (id, space, level, title, parent_id, kanban, state, lead, contributors,
        description, effort, scheduled_time)
     VALUES (?, ?, 'task', ?, '', ?, ?, '', '', '', '', '')`,
    [id, space, title, column.name, column.state],
  )

  // Creating the item is itself an event: passive communication starts here.
  await appendEvent(id, actorId ?? '', 'created', '')

  setResponseStatus(event, 201)
  return { id, kanban: column.name, state: column.state }
})
