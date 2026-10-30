<script setup lang="ts">
// <script setup>: everything declared here is usable in the template below.
const { data, actors } = useMeta()
const { filter } = useFilter()
const { space, load } = useItems()

const levels = ['project', 'epic', 'story', 'task', 'subtask']
// Only spaces that hold items in the seed are worth picking; personal spaces are empty.
const orgSpaces = computed(() => (data.value?.spaces ?? []).filter((s) => s.kind === 'organisation'))
</script>

<template>
  <div class="filter-bar">
    <label>Space
      <!-- v-model binds the select to the ref both ways; @change reloads the store. -->
      <select v-model="space" @change="load()">
        <option v-for="s in orgSpaces" :key="s.id" :value="s.id">{{ s.name }}</option>
      </select>
    </label>
    <label>Level
      <select v-model="filter.level">
        <option value="">all</option>
        <option v-for="l in levels" :key="l" :value="l">{{ l }}</option>
      </select>
    </label>
    <label>Contributor
      <select v-model="filter.contributor">
        <option value="">anyone</option>
        <option v-for="a in actors" :key="a.id" :value="a.id">{{ a.name }} ({{ a.kind }})</option>
      </select>
    </label>
    <label>Tag
      <select v-model="filter.tag">
        <option value="">any</option>
        <option v-for="t in data?.tags ?? []" :key="t" :value="t">{{ t }}</option>
      </select>
    </label>
  </div>
</template>

<style scoped>
/* scoped: these rules apply only to this component's elements. */
.filter-bar { display: flex; gap: 12px; flex-wrap: wrap; }
label { display: flex; gap: 4px; align-items: center; color: var(--muted); }
</style>
