// The filter shared by all three views. It only narrows what is shown; it
// never changes the store (the filter is not the space).

export interface Filter {
  level: string // '' = every level
  contributor: string // actor id, '' = anyone
  tag: string // tag name, '' = any tag
}

export function useFilter() {
  const filter = useState<Filter>('filter', () => ({ level: 'task', contributor: '', tag: '' }))
  const { items } = useItems()

  // computed: a value derived from other reactive values. Vue re-runs it only
  // when items or filter change, and every view reads the same result.
  const filtered = computed(() =>
    items.value.filter(
      (it) =>
        (!filter.value.level || it.level === filter.value.level) &&
        (!filter.value.contributor || it.contributors.includes(filter.value.contributor)) &&
        (!filter.value.tag || it.tags.includes(filter.value.tag))
    )
  )

  return { filter, filtered }
}
