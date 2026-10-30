// GET /api/q8?id=item-1250&to=QA — move one item to another column and log
// the event in one transaction. Without `to`, the item moves to the column
// with the next position in its space, wrapping around, so a bench run keeps
// cycling the item through the board.
export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const db = useSqlite()
  const id = String(q.id ?? 'item-1250')
  let to = q.to ? String(q.to) : ''
  if (!to) {
    // Columns of this space in board order; position is TEXT, so the ORDER BY
    // casts it to a number first.
    const columns = await db.prepare(
      'SELECT name FROM columns WHERE space = (SELECT space FROM tasks WHERE id = ?) ORDER BY CAST(position AS INTEGER)',
    ).all(id)
    const current = await db.prepare('SELECT kanban FROM tasks WHERE id = ?').get(id)
    const names = columns.map((column) => String((column as Record<string, unknown>).name))
    to = names[(names.indexOf(String((current as Record<string, unknown>).kanban)) + 1) % names.length]
  }
  return runBench(8, 'move item to another column, event in same transaction', () => q8Move(db, id, to))
})
