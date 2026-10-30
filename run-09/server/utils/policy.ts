// Product stub: the policy check. The spec leaves "what policies allow" OPEN,
// so everything is allowed. Files in server/utils/ are auto-imported into
// every server route, so routes call can() without an import line.
export function can(_actor: string, _action: string, _resource: string): boolean {
  return true
}
