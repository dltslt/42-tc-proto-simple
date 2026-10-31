<script setup lang="ts">
// Nuxt auto-import: defineProps defines component input properties with TypeScript types
interface Ancestor {
  id: string
  title: string
  level: string
}

const props = defineProps<{
  ancestry: Ancestor[]
  currentId: string
}>()

// Nuxt auto-import: defineEmits declares events emitted to the parent component
const emit = defineEmits<{
  (e: 'zoom', id: string): void
}>()

function onTabClick(id: string) {
  emit('zoom', id)
}
</script>

<template>
  <!-- Registerkarten: Notebook tabs showing the hierarchy depth / zoom path -->
  <nav class="registerkarten" aria-label="Zoom levels navigation">
    <div class="tabs-header">
      <span class="tabs-label">REGISTERKARTEN</span>
      <span class="depth-badge">Depth: {{ ancestry.length - 1 }}</span>
    </div>

    <ol class="tab-list">
      <li 
        v-for="(level, index) in ancestry" 
        :key="level.id"
        class="tab-item"
        :class="{ 'is-active': level.id === currentId }"
      >
        <button
          type="button"
          class="tab-button"
          :class="`level-${level.level}`"
          :aria-current="level.id === currentId ? 'step' : undefined"
          :title="`Zoom to ${level.level}: ${level.title}`"
          @click="onTabClick(level.id)"
        >
          <span class="tab-level-tag">{{ level.level }}</span>
          <span class="tab-title">{{ level.title || '(Untitled)' }}</span>
          <span v-if="index === ancestry.length - 1" class="tab-current-indicator" aria-hidden="true">●</span>
        </button>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
/* Clear notebook index divider layout (Registerkarten) */
.registerkarten {
  background: #f1f3f5;
  border-right: 1px solid #d0d7de;
  display: flex;
  flex-direction: column;
  padding: 0.75rem;
  min-width: 240px;
  max-width: 280px;
  flex-shrink: 0;
  user-select: none;
}

.tabs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0.5rem 0.5rem;
  border-bottom: 1px solid #d8dee4;
  margin-bottom: 0.5rem;
}

.tabs-label {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #57606a;
}

.depth-badge {
  font-size: 0.65rem;
  background: #eaeef2;
  color: #57606a;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
}

.tab-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

/* Staggered notebook index tab appearance */
.tab-item {
  position: relative;
}

.tab-button {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-align: left;
  padding: 0.5rem 0.65rem;
  background: #ffffff;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.825rem;
  color: #24292f;
  transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.tab-button:hover {
  background: #f6f8fa;
  border-color: #0969da;
}

.tab-button:focus-visible {
  outline: 2px solid #0969da;
  outline-offset: 1px;
}

.tab-item.is-active .tab-button {
  background: #ffffff;
  border-color: #0969da;
  border-left: 4px solid #0969da;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(9, 105, 218, 0.08);
}

.tab-level-tag {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.15rem 0.35rem;
  border-radius: 4px;
  background: #eef2f6;
  color: #57606a;
  font-weight: 600;
  flex-shrink: 0;
}

.level-space .tab-level-tag { background: #e8eaed; color: #3c4043; }
.level-project .tab-level-tag { background: #e1f0da; color: #1e4620; }
.level-epic .tab-level-tag { background: #ede7f6; color: #4a148c; }
.level-story .tab-level-tag { background: #e3f2fd; color: #0d47a1; }
.level-task .tab-level-tag { background: #fff3e0; color: #e65100; }
.level-subtask .tab-level-tag { background: #fce4ec; color: #880e4f; }

.tab-title {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tab-current-indicator {
  color: #0969da;
  font-size: 0.65rem;
}

/* Horizontal Registerkarten on narrow viewports */
@media (max-width: 767px) {
  .registerkarten {
    width: 100%;
    max-width: none;
    border-right: none;
    border-bottom: 1px solid #d0d7de;
    padding: 0.5rem;
  }

  .tabs-header {
    display: none;
  }

  .tab-list {
    flex-direction: row;
    overflow-x: auto;
    gap: 0.25rem;
  }

  .tab-button {
    white-space: nowrap;
    width: auto;
    padding: 0.35rem 0.5rem;
  }
}
</style>
