export function randomId(fallbackPrefix: string): string {
  return globalThis.crypto?.randomUUID?.() ?? `${fallbackPrefix}${Math.random().toString(16).slice(2)}`
}
