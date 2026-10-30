// GET /api/items?space=org-a → every item in one space, with its tags.
export default defineEventHandler(async (event) => {
  // getQuery reads the ?key=value part of the URL (h3, auto-imported).
  const { space } = getQuery(event)
  if (typeof space !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'space is required' })
  }
  return itemsInSpace(space)
})
