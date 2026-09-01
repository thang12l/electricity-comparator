const STORAGE_KEY = "amber-api-key";

export function readAmberApiKey(): string | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value?.trim() ? value : null;
  } catch {
    return null;
  }
}

export function writeAmberApiKey(key: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, key);
  } catch {
    // Privacy mode / quota — persistence is convenience only.
  }
}
