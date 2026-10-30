// Composable that manages the widget layout for the current (space, actor) pair.
export type WidgetType =
  | 'next'
  | 'blockers'
  | 'counts'
  | 'board'
  | 'activity'
  | 'upcoming'
  | 'touched'

export interface WidgetItem {
  id: string
  type: WidgetType
  x: number
  y: number
  w: number
  h: number
  settings: Record<string, any>
}

export interface CatalogueEntry {
  type: WidgetType
  title: string
  description: string
  defaultW: number
  defaultH: number
  defaultSettings: Record<string, any>
}

export const WIDGET_CATALOGUE: CatalogueEntry[] = [
  {
    type: 'next',
    title: 'My next items',
    description: 'My items not done, ordered by the next-work stub.',
    defaultW: 6,
    defaultH: 2,
    defaultSettings: {}
  },
  {
    type: 'blockers',
    title: 'Blockers by severity',
    description: 'Open blockers in the space, grouped by the four severities.',
    defaultW: 4,
    defaultH: 2,
    defaultSettings: { includeDone: false }
  },
  {
    type: 'activity',
    title: 'Recent activity',
    description: 'The latest events recorded on items in this space.',
    defaultW: 4,
    defaultH: 2,
    defaultSettings: { limit: 8 }
  },
  {
    type: 'counts',
    title: 'Counts chart',
    description: 'Hand-drawn bar chart of items per kanban column or state.',
    defaultW: 6,
    defaultH: 2,
    defaultSettings: { by: 'column' }
  },
  {
    type: 'upcoming',
    title: 'Upcoming',
    description: 'Items scheduled in the next N days.',
    defaultW: 4,
    defaultH: 2,
    defaultSettings: { days: 7 }
  },
  {
    type: 'touched',
    title: 'Last touched',
    description: 'Items I changed most recently.',
    defaultW: 4,
    defaultH: 2,
    defaultSettings: { limit: 6 }
  },
  {
    type: 'board',
    title: 'Board',
    description: 'Small kanban board for one hierarchy level; move items between columns.',
    defaultW: 8,
    defaultH: 2,
    defaultSettings: { level: 'task', mine: false }
  }
]

export function getCatalogueMeta(type: WidgetType): CatalogueEntry {
  return WIDGET_CATALOGUE.find(c => c.type === type) || WIDGET_CATALOGUE[0]!
}
