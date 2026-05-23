export class CacheLayer {
  private cache: Map<string, { value: any; expiry: number }> = new Map();

  public set(key: string, value: any, ttlSeconds: number = 3600) {
    const expiry = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expiry });
  }

  public get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  public invalidate(key: string) {
    this.cache.delete(key);
  }

  public invalidatePrefix(prefix: string) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  public clear() {
    this.cache.clear();
  }
}

export const cacheLayer = new CacheLayer();
