<script setup lang="ts">
// One item, drawn the same way in every view. The fields always come in this
// order: title · level · column · effort · scheduled · contributors · tags.
// `size` decides how many of them fit; smaller sizes cut from the end.
// The list view draws all seven as table cells in the same order (ListView.vue).
const props = defineProps<{ item: Item; size: 'card' | 'chip' }>()
const { actorName } = useMeta()

const FIELDS = ['title', 'level', 'kanban', 'effort', 'scheduled', 'contributors', 'tags'] as const
const KEEP = { card: 6, chip: 1 } // how many of FIELDS each size shows
const show = (f: (typeof FIELDS)[number]) => FIELDS.indexOf(f) < KEEP[props.size]

const when = computed(() =>
  props.item.scheduled_time
    ? new Date(props.item.scheduled_time).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—'
)
const initials = (id: string) => actorName(id).slice(0, 2)
</script>

<template>
  <!-- draggable + @dragstart: native HTML drag and drop. The item id travels in dataTransfer. -->
  <div :class="['item', size, item.state]" draggable="true" :title="item.title"
       @dragstart="(e) => e.dataTransfer?.setData('text/item', item.id)">
    <span v-if="show('title')" class="title">{{ item.title }}</span>
    <span v-if="show('level')" class="tag">{{ item.level }}</span>
    <span v-if="show('kanban')" class="col">{{ item.kanban }}</span>
    <span v-if="show('effort')" class="muted">{{ item.effort ?? '—' }}h</span>
    <span v-if="show('scheduled')" class="muted">{{ when }}</span>
    <span v-if="show('contributors')" class="people">
      <abbr v-for="c in item.contributors" :key="c" :title="actorName(c)">{{ initials(c) }}</abbr>
    </span>
    <span v-if="show('tags')" class="muted">{{ item.tags.join(', ') }}</span>
  </div>
</template>

<style scoped>
.item { display: flex; flex-wrap: wrap; gap: 4px 8px; align-items: baseline; cursor: grab; border-left: 3px solid var(--line); padding: 2px 6px; background: var(--panel); }
.item.started { border-left-color: orange; }
.item.done { border-left-color: seagreen; }
.card { border: 1px solid var(--line); border-left-width: 3px; border-radius: 4px; padding: 4px 6px; }
.chip { flex-shrink: 0; font-size: 12px; border-radius: 3px; flex-wrap: nowrap; overflow: hidden; white-space: nowrap; }
.chip .title { overflow: hidden; text-overflow: ellipsis; }
.title { font-weight: 500; }
.card .title { flex-basis: 100%; }
.tag { font-size: 11px; color: var(--muted); }
.col { font-size: 12px; padding: 0 4px; border-radius: 3px; background: var(--drop); }
.people abbr { text-decoration: none; font-size: 11px; margin-right: 2px; padding: 0 3px; border-radius: 50%; border: 1px solid var(--line); }
</style>
