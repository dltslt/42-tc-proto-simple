<script setup lang="ts">
// The step counter strip. It shows the gestures the latest journey took:
// create (Enter after typing), start (first move), close (to a done column).
defineProps<{
  createSteps: number
  startSteps: number
  closeSteps: number
  active: boolean
}>()
</script>

<template>
  <p v-if="active" class="steps">
    Last journey —
    <strong>create {{ createSteps }}</strong> step,
    <strong>start {{ startSteps }}</strong>,
    <strong>close {{ closeSteps }}</strong>
  </p>
  <p v-else class="steps muted">
    Type a title and press Enter — that is the whole create step.
  </p>
</template>
