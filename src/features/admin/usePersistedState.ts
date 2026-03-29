import { useState, useEffect, useCallback } from "react";

const STORAGE_PREFIX = "kumodot_admin_";

/**
 * Drop-in replacement for useState that auto-saves to localStorage.
 * On mount it loads saved data; on every state change it persists.
 * Call `clearDraft()` after a successful export to remove stale data.
 */
export function usePersistedState<T>(
  key: string,
  initializer: () => T
): [T, React.Dispatch<React.SetStateAction<T>>, { clearDraft: () => void; hasDraft: boolean }] {
  const storageKey = STORAGE_PREFIX + key;

  const [state, setStateRaw] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved) as T;
    } catch { /* ignore corrupt data */ }
    return initializer();
  });

  const [hasDraft] = useState(() => {
    try {
      return localStorage.getItem(storageKey) !== null;
    } catch {
      return false;
    }
  });

  // Persist on every change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch { /* storage full — ignore */ }
  }, [storageKey, state]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch { /* ignore */ }
  }, [storageKey]);

  return [state, setStateRaw, { clearDraft, hasDraft }];
}

/** Read-only peek at another tab's persisted draft (falls back to provided default). */
export function readDraft<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(STORAGE_PREFIX + key);
    if (saved) return JSON.parse(saved) as T;
  } catch { /* ignore */ }
  return fallback;
}