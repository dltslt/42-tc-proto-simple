// DELETE /api/layout?space=org-a
// Removes the current person's custom layout file so they return to the space's
// default layout ("reset to the space's default").
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const space = String(query.space || 'org-a')
  const actor = currentActor(event)
  const storage = useStorage<SpaceLayout>('layouts')

  await storage.removeItem(userLayoutKey(space, actor))

  const spaceDefault = (await storage.getItem(spaceLayoutKey(space))) || builtInDefaultLayout()
  return {
    ok: true,
    space,
    actor,
    source: 'default' as const,
    layout: spaceDefault
  }
})
