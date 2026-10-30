import type { H3Event } from 'h3'

// Identity stub: no login. The header picker stores the acting person in the
// `actor` cookie, and every server route reads it here. getCookie is an h3
// helper that Nitro auto-imports.
export function currentActor(event: H3Event): string {
  return getCookie(event, 'actor') || 'person-1'
}
