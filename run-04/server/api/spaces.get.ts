// A file in server/api/ becomes a URL: this one answers GET /api/spaces.
// It sends what the header and the filter need: spaces, their kanban columns,
// the actors, and the tags.
export default defineEventHandler(async () => {
  const d = db()
  const spaces = await d.prepare('SELECT * FROM spaces ORDER BY kind, name').all()
  const columns = await d
    .prepare('SELECT * FROM columns ORDER BY space, CAST(position AS INTEGER)')
    .all()
  const actors = await d.prepare('SELECT id, name, kind FROM actors ORDER BY name').all()
  const tags = await d.prepare('SELECT name FROM tags ORDER BY name').all()
  return { spaces, columns, actors, tags: tags.map((t: any) => t.name) }
})
