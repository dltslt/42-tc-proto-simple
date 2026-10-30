// PRODUCT STUBS. Answers that later replace whole behaviours live in this one
// file, so an answer can find and remove them in one place (AGENTS.md).

// The policy check. The spec makes policies the security boundary of a space,
// but no rule for them exists yet (OPEN), so everything is allowed. The
// signature is already the real shape: `can(actor, action, resource)`.
export function can(_actorId: string, _action: string, _resource: string): boolean {
  return true
}

// Which item to show next (OPEN, gold question in the spec): no product rule
// exists. This run experiments with "newest created first", which the list
// route implements by ordering on each item's `created` event. The constant
// only names the experiment in one place.
export const NEXT_RELEVANT_ORDERING = 'newest created first'

// Where a new item goes before it has a column (OPEN: a default `new` state).
// Stub: the space's first `unstarted` column, so the state is `unstarted`.
// The query lives in `firstUnstartedColumn` (server/utils/items.ts).
export const NEW_ITEM_PLACEMENT = 'first unstarted column'
