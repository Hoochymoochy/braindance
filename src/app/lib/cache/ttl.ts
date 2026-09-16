type Entry<T> = { expires: number; value: T };

const store = new Map<string, Entry<unknown>>();

export function ttlGet<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    store.delete(key);
    return null;
  }
  return entry.value as T;
}

export function ttlSet<T>(key: string, value: T, ttlMs: number): void {
  if (ttlMs <= 0) return;
  store.set(key, { expires: Date.now() + ttlMs, value });
}
