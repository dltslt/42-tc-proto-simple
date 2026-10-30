// PATCH /api/items/:id. The [id] in the file name becomes a route parameter.
// The body is { kanban } (a board move) or { scheduled_time } (a calendar move).
// It returns the updated item, so the client store can replace its copy.
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readBody<{ kanban?: string; scheduled_time?: string }>(event)
  const item = await itemById(id)
  if (!item) throw createError({ statusCode: 404, statusMessage: 'no such item' })

  const actor = currentActor(event)
  const d = db()

  if (body.kanban !== undefined) {
    if (!can(actor, 'item.move', item)) throw createError({ statusCode: 403 })
    // The column must belong to the item's space. Its state becomes the item's state,
    // so tasks.state and tasks.kanban can never disagree.
    const col: any = await d
      .prepare('SELECT state FROM columns WHERE space = ? AND name = ?')
      .get(item.space, body.kanban)
    if (!col) throw createError({ statusCode: 400, statusMessage: 'unknown column' })
    await d.prepare('UPDATE tasks SET kanban = ?, state = ? WHERE id = ?').run(body.kanban, col.state, id)
    // Same shape as the seed's events: kind 'column', detail = the new column.
    await logEvent(id, actor, 'column', body.kanban)
  }

  if (body.scheduled_time !== undefined) {
    if (!can(actor, 'item.reschedule', item)) throw createError({ statusCode: 403 })
    const t = body.scheduled_time
    if (t !== '' && Number.isNaN(Date.parse(t))) {
      throw createError({ statusCode: 400, statusMessage: 'bad time' })
    }
    await d.prepare('UPDATE tasks SET scheduled_time = ? WHERE id = ?').run(t, id)
    await logEvent(id, actor, 'rescheduled', `${item.scheduled_time || 'none'} → ${t || 'none'}`)
  }

  return itemById(id)
})

/** Every change leaves an event on the item (the spec's event log). */
async function logEvent(itemId: string, actor: string, kind: string, detail: string) {
  await db()
    .prepare('INSERT INTO events (id, item_id, at, actor_id, kind, detail) VALUES (?, ?, ?, ?, ?, ?)')
    .run(`event-${crypto.randomUUID()}`, itemId, new Date().toISOString(), actor, kind, detail)
}
