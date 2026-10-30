<script setup lang="ts">
// Components in app/components/ are auto-imported: <FilterBar /> needs no import.
const { load, error } = useItems()
const { actors } = useMeta()

// Identity stub: the acting person lives in the `actor` cookie, which the
// server reads in server/utils/actor.ts. useCookie returns a ref tied to it.
const actor = useCookie('actor', { default: () => 'person-1' })

type View = 'list' | 'board' | 'calendar'
const tab = ref<View>('list') // ref: a reactive box; the template reads tab without .value
const sideBySide = ref(true)
const views: View[] = ['list', 'board', 'calendar']
const shown = computed(() => (sideBySide.value ? views : [tab.value]))

// await at the top of <script setup> makes the page wait for the items
// during server rendering, so the first HTML already has them.
await load()
</script>

<template>
  <div class="app">
    <NuxtRouteAnnouncer />
    <header class="panel">
      <strong>Lerch · one item, many views</strong>
      <label class="muted">Acting as
        <select v-model="actor">
          <option v-for="a in actors.filter((a) => a.kind === 'person')" :key="a.id" :value="a.id">{{ a.name }}</option>
        </select>
      </label>
      <FilterBar />
      <span class="spacer" />
      <button :aria-pressed="sideBySide" @click="sideBySide = !sideBySide">side by side</button>
      <template v-if="!sideBySide">
        <button v-for="v in views" :key="v" :aria-pressed="tab === v" @click="tab = v">{{ v }}</button>
      </template>
    </header>
    <p v-if="error" class="error">{{ error }}</p>
    <main :class="{ grid: sideBySide }">
      <ListView v-if="shown.includes('list')" class="panel" />
      <BoardView v-if="shown.includes('board')" class="panel" />
      <CalendarView v-if="shown.includes('calendar')" class="panel" />
    </main>
  </div>
</template>

<style scoped>
.app { padding: 8px; display: flex; flex-direction: column; gap: 8px; height: 100dvh; }
header { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.spacer { flex: 1; }
main { flex: 1; min-height: 0; display: flex; flex-direction: column; }
main > * { flex: 1; }
main.grid { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 8px; }
main.grid > :first-child { grid-row: span 2; }
.error { color: crimson; margin: 0; }
</style>
