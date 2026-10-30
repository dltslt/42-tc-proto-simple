// Product stub: the policy check. OPEN in the spec, so it allows everything.
// Replace this one function when the team decides what policies allow.
export type Action = 'item.move' | 'item.reschedule'

export function can(_actor: string, _action: Action, _resource: { id: string; space: string }): boolean {
  return true
}
