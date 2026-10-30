<script setup lang="ts">
// The header: who is acting (the "current user" stub) and in which space.
// The server reads the person from the `x-actor-id` header of every request.
const props = defineProps<{
  actorId: string
  spaceId: string
  members: { id: string, name: string, role: string }[]
  spaces: { id: string, name: string, kind: string }[]
}>()

const emit = defineEmits<{
  'update:actorId': [id: string]
  'update:spaceId': [id: string]
}>()
</script>

<template>
  <header class="bar">
    <strong>Lerch</strong>
    <label>Current user
      <!-- `select` with v-model is Vue's two-way binding: the choice writes
           back into the parent's state through the emitted event. -->
      <select
        :value="actorId"
        @change="emit('update:actorId', ($event.target as HTMLSelectElement).value)"
      >
        <option v-for="m in members" :key="m.id" :value="m.id">{{ m.name }}</option>
      </select>
    </label>
    <label>Space
      <select
        :value="spaceId"
        @change="emit('update:spaceId', ($event.target as HTMLSelectElement).value)"
      >
        <option v-for="s in spaces" :key="s.id" :value="s.id">{{ s.name }}</option>
      </select>
    </label>
  </header>
</template>
