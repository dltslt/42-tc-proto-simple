// Files in app/composables/ are auto-imported across all Vue components.
// A composable is a function that shares reactive state and logic across components.
export interface ActorRow {
  id: string
  name: string
  kind: string
  spaces: string
}

export interface SpaceRow {
  id: string
  name: string
  kind: string
}

export interface MemberRow {
  space: string
  actor_id: string
  role: string
}

export function useDashboardContext() {
  // useCookie reads and writes an HTTP cookie on both server (SSR) and browser.
  // Changing actorCookie.value automatically updates the `actor` cookie sent to /api/*.
  const actorId = useCookie<string>('actor', {
    default: () => 'person-1',
    sameSite: 'lax'
  })

  // useState creates SSR-safe shared state keyed by string across the whole Nuxt app.
  // It is like a global reactive variable scoped to the current request/tab.
  const spaceId = useState<string>('current-space', () => 'org-a')

  // Bumping refreshTick tells every widget's useFetch query to re-run after an item moves.
  const refreshTick = useState<number>('widget-refresh-tick', () => 0)

  function triggerDataRefresh() {
    refreshTick.value += 1
  }

  return {
    actorId,
    spaceId,
    refreshTick,
    triggerDataRefresh
  }
}
