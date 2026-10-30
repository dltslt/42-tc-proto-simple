<script setup lang="ts">
// One row of the list. It owns the keyboard gestures: a row is focusable
// (tabindex="0" puts it in the tab order), and keys act on it.
//
//   -> or l : move to the next column (the "start" step)
//   <- or h : move back a column
//   x       : close (jump to the first `done` column)
//   Enter   : open the item's detail
//
// The same gestures exist as buttons, for mouse and touch.
const props = defineProps<{
  item: any
  columns: { name: string, state: string }[]
  open: boolean
}>()

const emit = defineEmits<{
  move: [item: any, kanban: string, newState: string]
  toggle: [item: any]
}>()

function columnIndex(name: string) {
  return props.columns.findIndex(c => c.name === name)
}

function move(offset: number) {
  const i = columnIndex(props.item.kanban) + offset
  if (i < 0 || i >= props.columns.length) return
  emit('move', props.item, props.columns[i].name, props.columns[i].state)
}

function close() {
  const done = props.columns.find(c => c.state === 'done')
  if (done) emit('move', props.item, done.name, done.state)
}

function onKeydown(e: KeyboardEvent) {
  // `isComposing` is true while an IME (Chinese, Japanese, ...) is mid-word;
  // Enter from the IME confirms text, it must not act as a gesture.
  if (e.isComposing) return
  if (e.key === 'ArrowRight' || e.key === 'l') { e.preventDefault(); move(1) }
  else if (e.key === 'ArrowLeft' || e.key === 'h') { e.preventDefault(); move(-1) }
  else if (e.key === 'x') { close() }
  else if (e.key === 'Enter') { e.preventDefault(); emit('toggle', props.item) }
}
</script>

<template>
  <li
    class="row"
    :class="{ done: item.state === 'done', open }"
    tabindex="0"
    @keydown="onKeydown"
  >
    <button class="row-title" @click="emit('toggle', item)">{{ item.title }}</button>
    <span class="chip" :data-state="item.state">{{ item.kanban }}</span>
    <span class="state">{{ item.state }}</span>
    <span class="gestures">
      <button title="previous column" :disabled="columnIndex(item.kanban) === 0" @click="move(-1)">&larr;</button>
      <button title="next column" :disabled="columnIndex(item.kanban) === columns.length - 1" @click="move(1)">&rarr;</button>
      <button title="close: first done column" :disabled="item.state === 'done'" @click="close">done</button>
    </span>
  </li>
</template>
