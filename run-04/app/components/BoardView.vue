<script setup lang="ts">
// Board view. Which items: one level at a time (the switch writes the shared
// filter's level, so the list follows). How drawn: one lane per kanban column
// of the space, cards inside. Primary action: drag a card to another lane.
const { filter, filtered } = useFilter()
const { columns } = useMeta()
const { moveTo } = useItems()

const levels = ['project', 'epic', 'story', 'task']
const over = ref('') // the lane under the dragged card, for the highlight

function onDrop(e: DragEvent, column: string) {
  over.value = ''
  const id = e.dataTransfer?.getData('text/item')
  const item = filtered.value.find((it) => it.id === id)
  if (item && item.kanban !== column) moveTo(item.id, column)
}
</script>

<template>
  <section>
    <h2>Board
      <button v-for="l in levels" :key="l" :aria-pressed="filter.level === l" @click="filter.level = l">{{ l }}</button>
    </h2>
    <p v-if="!levels.includes(filter.level)" class="muted">The board shows one level at a time. Pick one above.</p>
    <div v-else class="lanes">
      <!-- @dragover.prevent lets the element accept a drop (the browser refuses by default). -->
      <div v-for="c in columns" :key="c.name" :class="['lane', { 'drop-target': over === c.name }]"
           @dragover.prevent="over = c.name" @dragleave="over = ''" @drop="onDrop($event, c.name)">
        <h3>{{ c.name }} <span class="muted">{{ filtered.filter((it) => it.kanban === c.name).length }}</span></h3>
        <ItemCard v-for="it in filtered.filter((it) => it.kanban === c.name)" :key="it.id" :item="it" size="card" />
      </div>
    </div>
  </section>
</template>

<style scoped>
h2 { font-size: 15px; margin: 0 0 6px; display: flex; gap: 4px; align-items: center; }
h3 { font-size: 13px; margin: 0 0 4px; text-transform: capitalize; }
.lanes { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(150px, 1fr); gap: 6px; }
.lane { display: flex; flex-direction: column; gap: 4px; padding: 4px; border-radius: 4px; min-height: 80px; }
</style>
