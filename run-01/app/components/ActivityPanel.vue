<script setup lang="ts">
// The activity panel: events from the other members of the space, newest
// first. This is passive communication — nobody sends a message; moving a
// column or editing a field already is the message. The panel polls the
// activity route, so a change made by someone else appears within seconds.
const props = defineProps<{
  activity: {
    id: string
    at: string
    actor: string
    itemTitle: string
    kind: string
    detail: string
  }[]
}>()

function timeAgo(iso: string) {
  const minutes = Math.round((Date.now() - Date.parse(iso)) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)}h ago`
  return `${Math.round(minutes / 60 / 24)}d ago`
}

// `computed` recomputes when `activity` changes; the verb phrases make each
// event readable without knowing the event kinds.
const verbs: Record<string, string> = {
  created: 'created',
  column: 'moved',
  edit: 'edited',
  tags: 'tagged',
}
const lines = computed(() =>
  props.activity.map(e => ({
    id: e.id,
    text: `${verbs[e.kind] ?? e.kind} “${e.itemTitle}”${e.detail ? ` — ${e.detail}` : ''}`,
    actor: e.actor,
    when: timeAgo(e.at),
  })),
)
</script>

<template>
  <aside class="panel">
    <h3>Activity from others</h3>
    <ul>
      <li v-for="l in lines" :key="l.id">
        <span class="who">{{ l.actor }}</span> {{ l.text }}
        <span class="when">{{ l.when }}</span>
      </li>
      <li v-if="!lines.length" class="empty">Nothing from other members yet.</li>
    </ul>
  </aside>
</template>
