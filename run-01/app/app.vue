<script setup lang="ts">
// The whole slice on one screen: header (who is acting), the create input,
// the item list with its gestures, the open item's detail, the activity
// panel, and the step counter.
//
// The app has no router: `app.vue` is rendered directly. Nuxt auto-imports
// `ref`, `computed`, `useFetch` and the files of `app/components/` — none of
// them need an import statement here.

// The acting person and the space. person-2 (Ben) and org-a are a plain
// member and the organisation space the brief's scenario asks for.
const actorId = ref('person-2')
const spaceId = ref('org-a')
const openItemId = ref('')
const newTitle = ref('')

// The current-user stub on the server reads this header from every request.
// `computed` rebuilds it when the picker changes, and the reactive useFetch
// options below rerun their request when that happens.
const headers = computed(() => ({ 'x-actor-id': actorId.value }))

// useFetch fetches a URL and keeps the answer in `data`. The URL is a
// function, so a change to `spaceId` refetches. Without `await` the render
// does not block; the data fills in when the answer arrives.
const { data: me, refresh: refreshMe } = useFetch('/api/me', { headers })
const { data: items, refresh: refreshItems } = useFetch<any[]>(
  () => `/api/spaces/${spaceId.value}/items`, { headers },
)
const { data: members, refresh: refreshMembers } = useFetch<any[]>(
  () => `/api/spaces/${spaceId.value}/members`, { headers },
)
const { data: columns } = useFetch<{ name: string, state: string }[]>(
  () => `/api/spaces/${spaceId.value}/columns`, { headers },
)
const { data: activity, refresh: refreshActivity } = useFetch<any[]>(
  () => `/api/spaces/${spaceId.value}/activity`, { headers },
)

// `watch` runs a function when a reactive value changes. Here: when the user
// switches person, their space list arrives; if the open space is not theirs,
// move to one that is (their organisation space, else any).
watch(me, (m) => {
  const spaces = m?.spaces ?? []
  if (spaces.length && !spaces.some(s => s.id === spaceId.value)) {
    spaceId.value = spaces.find(s => s.kind === 'organisation')?.id ?? spaces[0].id
  }
})

// Keep the acting person valid for the open space: if the picked user is not
// a member of the space, fall back to the first member.
watch(members, (list) => {
  if (list?.length && !list.some(m => m.id === actorId.value)) {
    actorId.value = list[0].id
  }
})

// Destructuring the composable keeps its `ref`s as top-level bindings, so the
// template can read them without `.value` and still stay reactive.
const { createSteps, startSteps, closeSteps, phase, startJourney, recordMove } = useSteps()

function columnState(kanban: string) {
  return columns.value?.find(c => c.name === kanban)?.state ?? 'unstarted'
}

// POST one title. On the server this creates the item in the space's first
// `unstarted` column and writes the `created` event; here we count the
// journey's first step and refresh both panels.
async function createTask() {
  const title = newTitle.value.trim()
  if (!title) return
  const created = await $fetch<any>(`/api/spaces/${spaceId.value}/items`, {
    method: 'POST',
    headers: headers.value,
    body: { title },
  })
  newTitle.value = ''
  startJourney(created.id)
  openItemId.value = created.id
  await Promise.all([refreshItems(), refreshActivity()])
}

// An IME's Enter confirms the composed text; it must not submit the form.
function guardIme(e: KeyboardEvent) {
  if (e.isComposing) e.preventDefault()
}

// One PATCH per gesture. The server derives the state from the column, writes
// the event, and returns the updated item.
async function move(item: any, kanban: string, newState: string) {
  await $fetch(`/api/items/${item.id}`, {
    method: 'PATCH',
    headers: headers.value,
    body: { kanban },
  })
  recordMove(item.id, newState)
  await Promise.all([refreshItems(), refreshActivity()])
}

// Passive communication, client side: the activity panel polls every three
// seconds, so another member's change shows up without anyone sending
// anything. `onMounted`/`onUnmounted` are the component's setup and teardown.
let poll: ReturnType<typeof setInterval> | undefined
onMounted(() => { poll = setInterval(refreshActivity, 3000) })
onUnmounted(() => clearInterval(poll))

// The 40 tags the brief's database ships.
const { data: allTags } = useFetch<any[]>('/api/tags')
</script>

<template>
  <div class="app">
    <AppHeader
      v-model:actor-id="actorId"
      v-model:space-id="spaceId"
      :members="members ?? []"
      :spaces="me?.spaces ?? []"
    />

    <StepMeter
      :create-steps="createSteps"
      :start-steps="startSteps"
      :close-steps="closeSteps"
      :active="phase !== 'idle'"
    />

    <form class="create" @submit.prevent="createTask">
      <!-- The one create field: a title alone creates an item. -->
      <input
        v-model="newTitle"
        placeholder="Type a title, press Enter"
        aria-label="New item title"
        @keydown.enter="guardIme"
      />
      <button type="submit">Create</button>
    </form>

    <main class="columns">
      <section class="list">
        <h2>{{ me?.spaces?.find(s => s.id === spaceId)?.name ?? 'Space' }} — newest first</h2>
        <ul>
          <template v-for="item in items ?? []" :key="item.id">
            <ItemRow
              :item="item"
              :columns="columns ?? []"
              :open="item.id === openItemId"
              @move="move"
              @toggle="openItemId = openItemId === item.id ? '' : item.id"
            />
            <li v-if="item.id === openItemId" class="row-detail">
              <ItemDetail
                :item-id="item.id"
                :actor-id="actorId"
                :members="members ?? []"
                :tags="allTags ?? []"
                @changed="() => { refreshItems(); refreshActivity() }"
              />
            </li>
          </template>
        </ul>
      </section>
      <ActivityPanel :activity="activity ?? []" />
    </main>
  </div>
</template>
