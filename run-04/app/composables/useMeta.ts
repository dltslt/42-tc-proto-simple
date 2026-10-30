// Space metadata (spaces, columns, actors, tags), fetched once and shared.

interface Column { space: string; name: string; state: string; position: string }
interface Actor { id: string; name: string; kind: string }
interface Meta { spaces: { id: string; name: string; kind: string }[]; columns: Column[]; actors: Actor[]; tags: string[] }

export function useMeta() {
  // useFetch runs the request during server rendering and hands the result to
  // the browser, so the page does not fetch it twice. `key` shares one result
  // between every component that calls useMeta().
  const { data } = useFetch<Meta>('/api/spaces', { key: 'meta' })
  const { space } = useItems()

  const columns = computed(() => (data.value?.columns ?? []).filter((c) => c.space === space.value))
  const actors = computed(() => data.value?.actors ?? [])
  const actorName = (id: string) => actors.value.find((a) => a.id === id)?.name ?? id

  return { data, columns, actors, actorName }
}
