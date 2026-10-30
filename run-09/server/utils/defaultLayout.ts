// Default layout and widget catalogue metadata, shared by the layout routes.
export interface WidgetPlacement {
  id: string
  type: 'next' | 'blockers' | 'counts' | 'board' | 'activity' | 'upcoming' | 'touched'
  x: number
  y: number
  w: number
  h: number
  settings: Record<string, string | number | boolean>
}

export interface SpaceLayout {
  widgets: WidgetPlacement[]
  updatedAt?: string
  updatedBy?: string
}

export function builtInDefaultLayout(): SpaceLayout {
  return {
    widgets: [
      { id: 'w-next', type: 'next', x: 1, y: 1, w: 6, h: 2, settings: {} },
      { id: 'w-counts', type: 'counts', x: 7, y: 1, w: 6, h: 2, settings: { by: 'column' } },
      { id: 'w-board', type: 'board', x: 1, y: 3, w: 8, h: 2, settings: { level: 'task', mine: false } },
      { id: 'w-blockers', type: 'blockers', x: 9, y: 3, w: 4, h: 2, settings: { includeDone: false } },
      { id: 'w-activity', type: 'activity', x: 1, y: 5, w: 4, h: 2, settings: { limit: 8 } },
      { id: 'w-upcoming', type: 'upcoming', x: 5, y: 5, w: 4, h: 2, settings: { days: 7 } },
      { id: 'w-touched', type: 'touched', x: 9, y: 5, w: 4, h: 2, settings: { limit: 6 } }
    ]
  }
}

export function spaceLayoutKey(space: string): string {
  return `space-${space}.json`
}

export function userLayoutKey(space: string, actor: string): string {
  return `user-${space}-${actor}.json`
}
