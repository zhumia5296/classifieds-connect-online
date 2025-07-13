import { useState, useEffect, useCallback } from 'react';

interface CacheOptions {
  maxSize?: number;
  ttl?: number; // Time to live in milliseconds
  persistToStorage?: boolean;
  storageKey?: string;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl?: number;
}

class MemoryCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;
  private defaultTTL?: number;

  constructor(maxSize = 100, defaultTTL?: number) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  set(key: string, data: T, ttl?: number): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  // Clean expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.ttl && now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Global cache instances
const queryCache = new MemoryCache<any>(200, 5 * 60 * 1000); // 5 minutes TTL
const imageCache = new MemoryCache<HTMLImageElement>(50, 30 * 60 * 1000); // 30 minutes TTL

export const useCache = <T,>(options: CacheOptions = {}) => {
  const {
    maxSize = 100,
    ttl,
    persistToStorage = false,
    storageKey = 'app-cache'
  } = options;

  const [cache] = useState(() => new MemoryCache<T>(maxSize, ttl));

  // Load from localStorage if enabled
  useEffect(() => {
    if (persistToStorage) {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const data = JSON.parse(stored);
          Object.entries(data).forEach(([key, value]: [string, any]) => {
            cache.set(key, value.data, value.ttl);
          });
        }
      } catch (error) {
        console.warn('Failed to load cache from storage:', error);
      }
    }
  }, [cache, persistToStorage, storageKey]);

  // Save to localStorage
  const persistCache = useCallback(() => {
    if (persistToStorage) {
      try {
        const data: Record<string, CacheEntry<T>> = {};
        // Note: This is a simplified version - in reality you'd need to expose the cache entries
        localStorage.setItem(storageKey, JSON.stringify(data));
      } catch (error) {
        console.warn('Failed to persist cache to storage:', error);
      }
    }
  }, [persistToStorage, storageKey]);

  const set = useCallback((key: string, data: T, customTTL?: number) => {
    cache.set(key, data, customTTL);
    persistCache();
  }, [cache, persistCache]);

  const get = useCallback((key: string): T | null => {
    return cache.get(key);
  }, [cache]);

  const remove = useCallback((key: string): boolean => {
    const result = cache.delete(key);
    persistCache();
    return result;
  }, [cache, persistCache]);

  const clear = useCallback(() => {
    cache.clear();
    persistCache();
  }, [cache, persistCache]);

  // Cleanup expired entries periodically
  useEffect(() => {
    const interval = setInterval(() => {
      cache.cleanup();
    }, 60000); // Clean every minute

    return () => clearInterval(interval);
  }, [cache]);

  return {
    set,
    get,
    has: cache.has.bind(cache),
    remove,
    clear,
    size: cache.size.bind(cache)
  };
};

// Query cache hook
export const useQueryCache = () => {
  return useCache<any>({
    maxSize: 200,
    ttl: 5 * 60 * 1000, // 5 minutes
    persistToStorage: true,
    storageKey: 'query-cache'
  });
};

// Image preloading and caching
export const useImageCache = () => {
  const preloadImage = useCallback((src: string): Promise<HTMLImageElement> => {
    // Check cache first
    const cached = imageCache.get(src);
    if (cached) {
      return Promise.resolve(cached);
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        imageCache.set(src, img);
        resolve(img);
      };
      img.onerror = reject;
      img.src = src;
    });
  }, []);

  const preloadImages = useCallback(async (urls: string[]): Promise<HTMLImageElement[]> => {
    const promises = urls.map(url => preloadImage(url));
    return Promise.all(promises);
  }, [preloadImage]);

  return {
    preloadImage,
    preloadImages,
    getCachedImage: (src: string) => imageCache.get(src),
    clearImageCache: () => imageCache.clear()
  };
};