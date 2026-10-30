import type { H3Event } from 'h3'

// Identity stub: there is no login. The header picker stores the acting person
// in the `actor` cookie; a script may send the `x-actor` header instead.
export function currentActor(event: H3Event): string {
  // getHeader / getCookie are h3 helpers, auto-imported in server code.
  return getHeader(event, 'x-actor') || getCookie(event, 'actor') || 'person-1'
}
