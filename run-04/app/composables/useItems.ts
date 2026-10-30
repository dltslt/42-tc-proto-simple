// A composable is a function named use… that holds shared reactive state or
// logic. Files in app/composables/ are auto-imported into every component.
//
// This is THE store of items for the current space. Every view reads it.
// No view keeps its own copy: a change goes to the server, and the server's
// answer replaces the item here, so all three views redraw from the same data.

export interface Item {
  id: string
  space: string
  level: string
  title: string
  parent_id: string
  kanban: string
  state: string
  lead: string
  contributors: string[]
  effort: number | null
  scheduled_time: string // ISO string, '' when not scheduled
  tags: string[]
}

export function useItems() {
  // useState is Nuxt's shared ref: every call with the key 'items' returns the
  // same reactive value, in every component. A ref is a box whose .value the
  // template watches; changing it redraws whatever reads it.
  const items = useState<Item[]>('items', () => [])
  const space = useState<string>('space', () => 'org-a')
  const error = useState<string>('items-error', () => '')

  // async/await: $fetch returns a Promise, and await waits for the answer.
  // $fetch is Nuxt's auto-imported fetch helper; it parses JSON for us.
  async function load() {
    items.value = await $fetch<Item[]>('/api/items', { query: { space: space.value } })
  }

  /** Sends one change and puts the server's version of the item into the store. */
  async function patch(id: string, body: Partial<Pick<Item, 'kanban' | 'scheduled_time'>>) {
    try {
      const updated = await $fetch<Item>(`/api/items/${id}`, { method: 'PATCH', body })
      const i = items.value.findIndex((it) => it.id === id)
      if (i >= 0) items.value[i] = updated // reactive: every view reading items redraws
      error.value = ''
    } catch (e: any) {
      error.value = e?.statusMessage || 'change failed'
    }
  }

  const moveTo = (id: string, kanban: string) => patch(id, { kanban })
  const reschedule = (id: string, when: Date | null) =>
    patch(id, { scheduled_time: when ? when.toISOString() : '' })

  return { items, space, error, load, moveTo, reschedule }
}
