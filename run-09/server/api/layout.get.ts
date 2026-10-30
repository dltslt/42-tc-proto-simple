// GET /api/layout?space=org-a
// Reads from Nitro's key-value storage (`useStorage('layouts')`), which maps to
// JSON files in `run-09/layouts/`. Returns the acting person's copy when one
// exists; otherwise falls back to the space's default layout.
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const space = String(query.space || 'org-a')
  const actor = currentActor(event)
  // useStorage is auto-imported by Nitro and mounts the driver from nuxt.config.ts.
  const storage = useStorage<SpaceLayout>('layouts')

  const personalKey = userLayoutKey(space, actor)
  const defaultKey = spaceLayoutKey(space)

  const personal = await storage.getItem(personalKey)
  if (personal && Array.isArray(personal.widgets)) {
    return {
      space,
      actor,
      source: 'personal' as const,
      layout: personal
    }
  }

  let spaceDefault = await storage.getItem(defaultKey)
  if (!spaceDefault || !Array.isArray(spaceDefault.widgets)) {
    spaceDefault = builtInDefaultLayout()
    await storage.setItem(defaultKey, spaceDefault)
  }

  return {
    space,
    actor,
    source: 'default' as const,
    layout: spaceDefault
  }
})
