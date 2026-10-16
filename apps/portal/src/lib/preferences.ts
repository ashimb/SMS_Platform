/**
 * Non-sensitive UI preferences (colour mode, language) in localStorage.
 *
 * Only these whitelisted keys and values are ever written. Credentials, tokens, user data and
 * school records must never go through here (or any web storage): see lib/auth-store.ts.
 * Access is wrapped because storage can be disabled (private mode, enterprise policy).
 */
const ALLOWED = {
  "sp-color-mode": ["light", "dark", "system"],
  "sp-lang": ["en", "bn"],
} as const;

export type PreferenceKey = keyof typeof ALLOWED;
export type PreferenceValue<K extends PreferenceKey> = (typeof ALLOWED)[K][number];

export function readPreference<K extends PreferenceKey>(key: K): PreferenceValue<K> | null {
  try {
    const value = window.localStorage.getItem(key);
    return (ALLOWED[key] as readonly string[]).includes(value ?? "")
      ? (value as PreferenceValue<K>)
      : null;
  } catch {
    return null;
  }
}

export function writePreference<K extends PreferenceKey>(key: K, value: PreferenceValue<K>): void {
  if (!(ALLOWED[key] as readonly string[]).includes(value)) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage unavailable: the preference lasts for this page only.
  }
}
