<script setup lang="ts">
// The detail view of one item: the fields the list does not show, each one
// editable in place and saved on its own — no save button, no form. Every
// change is one PATCH request, which writes one event on the server.
const props = defineProps<{
  itemId: string
  actorId: string
  members: { id: string, name: string }[]
  tags: { id: string, name: string }[]
}>()

const emit = defineEmits<{ changed: [] }>()

// useFetch fetches the URL and keeps the answer in `data`. When the item id
// changes, the request refetches. `refresh()` refetches after our own edits.
// Without `await`, the first render shows the loading branch below and the
// data fills in when the answer arrives.
const { data: item, refresh } = useFetch<any>(() => `/api/items/${props.itemId}`, {
  headers: computed(() => ({ 'x-actor-id': props.actorId })),
})
// `computed` is a value that recomputes when its dependencies change; here it
// builds the header object the server's current-user stub reads.

async function patch(body: Record<string, unknown>) {
  await $fetch(`/api/items/${props.itemId}`, {
    method: 'PATCH',
    headers: { 'x-actor-id': props.actorId },
    body,
  })
  // `async`/`await`: each request waits for the server's answer before the
  // next line runs, so `refresh` sees the item already updated.
  await refresh()
  emit('changed')
}

// Saves one text field when it loses focus, and only if it changed.
function saveText(field: 'title' | 'description' | 'effort', e: Event) {
  const value = (e.target as HTMLInputElement).value
  if (item.value && value !== item.value[field]) patch({ [field]: value })
}

function toggleContributor(id: string, on: boolean) {
  const current: string[] = item.value?.contributors ?? []
  const next = on ? [...current, id] : current.filter(c => c !== id)
  patch({ contributors: next })
}

function toggleTag(id: string, on: boolean) {
  const current: string[] = (item.value?.tags ?? []).map((t: any) => t.id)
  const next = on ? [...current, id] : current.filter(c => c !== id)
  patch({ tags: next })
}

function timeAgo(iso: string) {
  const minutes = Math.round((Date.now() - Date.parse(iso)) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)}h ago`
  return `${Math.round(minutes / 60 / 24)}d ago`
}
</script>

<template>
  <div v-if="item" class="detail">
    <label>Title
      <input :value="item.title" @blur="saveText('title', $event)" />
    </label>
    <label>Description
      <textarea :value="item.description" @blur="saveText('description', $event)"></textarea>
    </label>
    <label>Effort
      <input :value="item.effort" @blur="saveText('effort', $event)" />
    </label>

    <fieldset>
      <legend>Contributors (each tick saves at once)</legend>
      <label v-for="m in members" :key="m.id" class="check">
        <input
          type="checkbox"
          :checked="item.contributors.includes(m.id)"
          @change="toggleContributor(m.id, ($event.target as HTMLInputElement).checked)"
        />
        {{ m.name }}
      </label>
    </fieldset>

    <details>
      <summary>Tags ({{ item.tags.length }})</summary>
      <label v-for="t in tags" :key="t.id" class="check">
        <input
          type="checkbox"
          :checked="item.tags.some((it: any) => it.id === t.id)"
          @change="toggleTag(t.id, ($event.target as HTMLInputElement).checked)"
        />
        {{ t.name }}
      </label>
    </details>

    <h4>Events</h4>
    <ul class="events">
      <li v-for="e in item.events" :key="e.id">
        <span class="who">{{ e.actor }}</span>
        <span class="kind" :data-kind="e.kind">{{ e.kind }}</span>
        <span class="detail">{{ e.detail }}</span>
        <span class="when">{{ timeAgo(e.at) }}</span>
      </li>
    </ul>
  </div>
  <p v-else>Loading…</p>
</template>
