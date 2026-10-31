// Nitro server route: this file under server/api automatically becomes the endpoint GET /api/zoom
import { getDb } from '../utils/db'
import { getTaskOrderSql } from '../utils/stubs'

// defineEventHandler is a Nuxt/Nitro auto-import for HTTP request handlers
export default defineEventHandler((event) => {
  // getQuery is a Nitro auto-import to extract URL query parameters
  const query = getQuery(event)
  const target = (query.target as string) || 'space:org-a'

  const db = getDb()

  // Case 1: Target is a space (e.g. "space:org-a" or starts with "space:")
  if (target.startsWith('space:') || !target.startsWith('item-')) {
    const spaceId = target.replace(/^space:/, '')
    const spaceRow = db.prepare('SELECT id, name, kind FROM spaces WHERE id = ?').get(spaceId) as { id: string; name: string; kind: string } | undefined
    const space = spaceRow || (db.prepare('SELECT id, name, kind FROM spaces LIMIT 1').get() as { id: string; name: string; kind: string })

    const columns = db.prepare('SELECT space, name, state, position FROM columns WHERE space = ? ORDER BY position ASC').all(space.id)

    // Children of a space are its root tasks (parent_id is empty)
    const orderSql = getTaskOrderSql()
    const children = db.prepare(`SELECT * FROM tasks WHERE space = ? AND (parent_id = '' OR parent_id IS NULL) ${orderSql}`).all(space.id)

    return {
      kind: 'space' as const,
      space,
      current: {
        id: `space:${space.id}`,
        title: space.name,
        level: 'space',
        space: space.id,
        description: `Space overview for ${space.name} (${space.kind})`
      },
      ancestry: [
        { id: `space:${space.id}`, title: space.name, level: 'space' }
      ],
      children,
      columns
    }
  }

  // Case 2: Target is an item (e.g. "item-1")
  const item = db.prepare('SELECT * FROM tasks WHERE id = ?').get(target) as any
  if (!item) {
    throw createError({ statusCode: 404, statusMessage: `Item ${target} not found` })
  }

  const space = db.prepare('SELECT id, name, kind FROM spaces WHERE id = ?').get(item.space) as any
  const columns = db.prepare('SELECT space, name, state, position FROM columns WHERE space = ? ORDER BY position ASC').all(item.space)

  // Construct ancestry path by traversing parent_id upwards
  const ancestryItems: Array<{ id: string; title: string; level: string }> = []
  let curr = item
  while (curr) {
    ancestryItems.unshift({ id: curr.id, title: curr.title, level: curr.level })
    if (curr.parent_id && curr.parent_id !== '') {
      curr = db.prepare('SELECT id, title, level, parent_id FROM tasks WHERE id = ?').get(curr.parent_id) as any
    } else {
      curr = null
    }
  }

  // Add the space as the outermost layer of the ancestry path
  const ancestry = [
    { id: `space:${space.id}`, title: space.name, level: 'space' },
    ...ancestryItems
  ]

  // Children of this item
  const orderSql = getTaskOrderSql()
  const children = db.prepare(`SELECT * FROM tasks WHERE parent_id = ? ${orderSql}`).all(item.id)

  return {
    kind: 'item' as const,
    space,
    current: item,
    ancestry,
    children,
    columns
  }
})
