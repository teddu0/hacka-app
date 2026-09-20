type CacheEntry<T> = { value: T; expiresAt: number };

/** Keeps successful analyses in memory; statement data is never written to disk. */
export class AnalysisCache<T> {
  private readonly entries = new Map<string, CacheEntry<T>>();
  private readonly pending = new Map<string, Promise<T>>();

  constructor(private readonly ttlMs = 7 * 24 * 60 * 60 * 1000, private readonly maxEntries = 100) {}

  async getOrCreate(key: string, create: () => Promise<T>): Promise<{ value: T; cached: boolean }> {
    const now = Date.now();
    const cached = this.entries.get(key);
    if (cached && cached.expiresAt > now) return { value: cached.value, cached: true };
    if (cached) this.entries.delete(key);
    const active = this.pending.get(key);
    if (active) return { value: await active, cached: true };
    const operation = create();
    this.pending.set(key, operation);
    try {
      const value = await operation;
      this.removeExpired(now);
      while (this.entries.size >= this.maxEntries) this.entries.delete(this.entries.keys().next().value!);
      this.entries.set(key, { value, expiresAt: now + this.ttlMs });
      return { value, cached: false };
    } finally {
      this.pending.delete(key);
    }
  }

  private removeExpired(now: number) {
    for (const [key, entry] of this.entries) if (entry.expiresAt <= now) this.entries.delete(key);
  }
}
