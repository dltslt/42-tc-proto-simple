// PUT /api/layout?space=org-a[&scope=default]
// Saves a layout configuration into `run-09/layouts/`. By default this writes
// the acting person's own copy (`user-<space>-<actor>.json`), leaving the
// space's default untouched for other members. Passing `scope=default` saves
// the space's default layout (gated by the `can()` policy stub).
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const space = String(query.space || 'org-a')
  const scope = query.scope === 'default' ? 'default' : 'personal'
  const actor = currentActor(event)

  if (!can(actor, `save-${scope}-layout`, space)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden by policy' })
  }

  const body = await readBody<{ widgets?: WidgetPlacement[] }>(event)
  if (!body || !Array.isArray(body.widgets)) {
    throw createError({ statusCode: 400, statusMessage: 'Expected { widgets: [...] }' })
  }

  const storage = useStorage<SpaceLayout>('layouts')
  const record: SpaceLayout = {
    widgets: body.widgets,
    updatedAt: new Date().toISOString(),
    updatedBy: actor
  }

  const key = scope === 'default' ? spaceLayoutKey(space) : userLayoutKey(space, actor)
  await storage.setItem(key, record)

  return {
    ok: true,
    space,
    actor,
    source: scope,
    layout: record
  }
})
