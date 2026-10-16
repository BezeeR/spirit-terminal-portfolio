export const INTRO_SEEN_KEY = "spirit-terminal-intro-seen";
export const MUSIC_PREFERENCE_KEY = "spirit-terminal-midnight-radio-autoplay";

export function readPreference(key: string): string | null {
  if (typeof window === "undefined") return null;
  for (const name of ["localStorage", "sessionStorage"] as const) {
    try {
      const value = window[name].getItem(key);
      if (value !== null) return value;
    } catch { /* Storage can be disabled by browser settings. */ }
  }
  return null;
}

export function writePreference(key: string, value: string) {
  for (const name of ["localStorage", "sessionStorage"] as const) {
    try { window[name].setItem(key, value); } catch { /* Preferences are optional. */ }
  }
}
