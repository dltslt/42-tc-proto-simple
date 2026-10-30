// A tiny state machine that counts the gestures of one task's ordinary
// journey, so the interface can answer the brief's question: how few steps
// does the ordinary life of a task take?
//
//   idle -> created -> started -> closed
//
// Typing a title and pressing Enter is the one create step. The first move of
// the journey item is the start step, and every move after that counts toward
// close until the item lands in a `done` column.
export function useSteps() {
  // `ref` is Vue's reactive value: reading it in a template re-renders when
  // it changes.
  const createSteps = ref(0)
  const startSteps = ref(0)
  const closeSteps = ref(0)
  const phase = ref<'idle' | 'created' | 'started' | 'closed'>('idle')
  const journeyItemId = ref('')

  function startJourney(itemId: string) {
    journeyItemId.value = itemId
    createSteps.value = 1
    startSteps.value = 0
    closeSteps.value = 0
    phase.value = 'created'
  }

  // Returns true when the move belonged to the counted journey.
  function recordMove(itemId: string, newState: string): boolean {
    if (phase.value === 'idle' || phase.value === 'closed') return false
    if (itemId !== journeyItemId.value) return false

    if (phase.value === 'created') {
      startSteps.value++
      phase.value = 'started'
      if (newState === 'done') {
        closeSteps.value++
        phase.value = 'closed'
      }
    } else {
      closeSteps.value++
      if (newState === 'done') phase.value = 'closed'
    }
    return true
  }

  return { createSteps, startSteps, closeSteps, phase, journeyItemId, startJourney, recordMove }
}
