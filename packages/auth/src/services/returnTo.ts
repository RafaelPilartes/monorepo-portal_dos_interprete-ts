// Where to go after login (D-05). Only a path inside this app is followed; anything else — another
// site, "//host", "/\host", a scheme — goes to the app's home (accounts-and-organizations.md,
// criterion 2; AD-021 item 5).
export function safeReturnTo(value: string | null | undefined, fallback = '/'): string {
  if (!value) return fallback
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback
  // A control character (a newline, a tab) has no place in a path.
  if ([...value].some((character) => character.charCodeAt(0) < 0x20)) return fallback
  return value
}
