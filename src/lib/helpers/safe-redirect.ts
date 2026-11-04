/** True if the string contains ASCII control characters (U+0000–U+001F) or U+007F. */
function hasControlCharacters(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index)
    if (code < 0x20 || code === 0x7f) return true
  }
  return false
}

/**
 * Returns `path` only if it is a same-origin, absolute app path; otherwise `fallback`.
 * Prevents open redirects through `?next=` parameters (e.g. `//evil.com`, `https://…`).
 */
export function safeRedirectPath(path: string | null | undefined, fallback = "/dashboard"): string {
  if (!path || path.length > 512) return fallback
  if (!path.startsWith("/") || path.startsWith("//")) return fallback
  // Browsers may normalise "\" to "/", turning "/\evil.com" into a protocol-relative URL.
  if (path.includes("\\") || hasControlCharacters(path)) return fallback
  return path
}
