<script setup lang="ts">
// Root component of the Nuxt app. Renders the top bar with the person picker
// and space picker, and mounts the widget dashboard below.
import type { ActorRow, SpaceRow, MemberRow } from '~/composables/useActor'

const { actorId, spaceId } = useDashboardContext()

// useFetch runs on the server during SSR and hydrates on the client without a
// second network round-trip.
const { data: metaData } = await useFetch<{
  currentActor: string
  actors: ActorRow[]
  spaces: SpaceRow[]
  members: MemberRow[]
}>('/api/actors')

const actors = computed(() => metaData.value?.actors || [])
const spaces = computed(() => metaData.value?.spaces || [])
const members = computed(() => metaData.value?.members || [])

// Spaces that the selected actor belongs to, organisation spaces first.
const actorSpaces = computed(() => {
  const memberSpaceIds = new Set(
    members.value.filter(m => m.actor_id === actorId.value).map(m => m.space)
  )
  return spaces.value.filter(s => memberSpaceIds.has(s.id))
})

const currentActorObj = computed(() =>
  actors.value.find(a => a.id === actorId.value)
)

const currentRole = computed(() =>
  members.value.find(m => m.actor_id === actorId.value && m.space === spaceId.value)?.role || 'member'
)

// When switching to an actor who is not a member of the active space, switch to
// their first organisation space so the dashboard always shows a valid space.
function onActorChange(newActorId: string) {
  actorId.value = newActorId
  const allowed = members.value
    .filter(m => m.actor_id === newActorId)
    .map(m => m.space)
  if (!allowed.includes(spaceId.value)) {
    const orgSpace = allowed.find(s => s.startsWith('org-')) || allowed[0] || 'org-a'
    spaceId.value = orgSpace
  }
}
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <div class="brand">
        <span class="brand-mark">Lerch</span>
        <span class="brand-sub">fast-09 · morning widget grid</span>
      </div>

      <div class="pickers">
        <label class="picker-label">
          <span>Acting person</span>
          <select
            class="picker-select"
            data-testid="actor-select"
            :value="actorId"
            @change="onActorChange(($event.target as HTMLSelectElement).value)"
          >
            <option v-for="a in actors" :key="a.id" :value="a.id">
              {{ a.name }} ({{ a.id }})
            </option>
          </select>
        </label>

        <label class="picker-label">
          <span>Space</span>
          <select
            v-model="spaceId"
            class="picker-select"
            data-testid="space-select"
          >
            <option v-for="s in actorSpaces" :key="s.id" :value="s.id">
              {{ s.name }} ({{ s.kind }})
            </option>
          </select>
        </label>

        <span class="actor-badge">
          {{ currentActorObj?.name || actorId }} · {{ currentRole }} in {{ spaceId }}
        </span>
      </div>
    </header>

    <main class="main-area">
      <WidgetGrid />
    </main>
  </div>
</template>

<style>
*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  background: #f0f3f6;
  color: #1f2328;
  font-size: 14px;
  line-height: 1.45;
}

.app-shell {
  min-block-size: 100dvh;
  display: flex;
  flex-direction: column;
}

.topbar {
  display: flex;
  flex-wrap: wrap;
  align-items: safe center;
  gap: 1rem;
  padding-block: 0.65rem;
  padding-inline: 1.25rem;
  background: #1f2328;
  color: #ffffff;
}

.brand {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  margin-inline-end: auto;
}

.brand-mark {
  font-weight: 700;
  font-size: 1.1rem;
  letter-spacing: -0.01em;
}

.brand-sub {
  font-size: 0.8rem;
  color: #9198a1;
}

.pickers {
  display: flex;
  flex-wrap: wrap;
  align-items: safe center;
  gap: 0.85rem;
}

.picker-label {
  display: inline-flex;
  align-items: safe center;
  gap: 0.4rem;
  font-size: 0.78rem;
  color: #d0d7de;
}

.picker-select {
  background: #2f353d;
  color: #ffffff;
  border: 1px solid #484f58;
  border-radius: 5px;
  padding-block: 0.28rem;
  padding-inline: 0.5rem;
  font-size: 0.82rem;
}

.actor-badge {
  font-size: 0.76rem;
  background: #30363d;
  color: #c9d1d9;
  padding-block: 0.22rem;
  padding-inline: 0.55rem;
  border-radius: 999px;
  border: 1px solid #484f58;
}

.main-area {
  flex: 1 1 auto;
  padding: 1rem 1.25rem 2rem;
}
</style>
