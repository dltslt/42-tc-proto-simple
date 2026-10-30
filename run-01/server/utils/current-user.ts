// The "current user" stub. There is no login (AGENTS.md): the interface header
// holds a picker, and it sends the acting person's id in the `x-actor-id`
// header. The server trusts that header. Replacing this stub with real
// identity means replacing this one function.
import type { H3Event } from 'h3'

export async function currentUserId(event: H3Event): Promise<string | undefined> {
  return getHeader(event, 'x-actor-id') || undefined
}
