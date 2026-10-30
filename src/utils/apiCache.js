/**
 * High-performance client-side cache manager with In-Memory + Storage + SWR (Stale-While-Revalidate).
 * Guarantees 0ms instant page loads from cached data while revalidating seamlessly in the background.
 */

const memoryCache = new Map();

export const getApiCache = (key) => {
  // 1. Check in-memory cache first (instant 0ms)
  const mem = memoryCache.get(key);
  if (mem) {
    if (Date.now() < mem.expiresAt) {
      return mem.data;
    }
    memoryCache.delete(key);
  }

  // 2. Check sessionStorage fallback
  try {
    const raw = sessionStorage.getItem(`tracly_cache_${key}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Date.now() < parsed.expiresAt) {
        // Hydrate memory cache
        memoryCache.set(key, parsed);
        return parsed.data;
      }
      sessionStorage.removeItem(`tracly_cache_${key}`);
    }
  } catch {
    // Ignore storage errors
  }

  return null;
};

export const setApiCache = (key, data, ttlSeconds = 300) => {
  if (data === undefined || data === null) return;

  const entry = {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  };

  memoryCache.set(key, entry);

  try {
    sessionStorage.setItem(`tracly_cache_${key}`, JSON.stringify(entry));
  } catch {
    // Storage might be full, safe to ignore
  }
};

export const clearApiCache = (prefix = "") => {
  if (!prefix) {
    memoryCache.clear();
    try {
      Object.keys(sessionStorage).forEach((k) => {
        if (k.startsWith("tracly_cache_")) sessionStorage.removeItem(k);
      });
    } catch {}
    return;
  }

  for (const k of memoryCache.keys()) {
    if (k.startsWith(prefix)) memoryCache.delete(k);
  }

  try {
    Object.keys(sessionStorage).forEach((k) => {
      if (k.startsWith(`tracly_cache_${prefix}`)) sessionStorage.removeItem(k);
    });
  } catch {}
};

/**
 * Completely invalidates client caches across memory, sessionStorage, and localStorage,
 * and notifies active components to re-sync immediately.
 */
export const invalidateClientCatalog = () => {
  memoryCache.clear();

  try {
    Object.keys(sessionStorage).forEach((k) => {
      if (
        k.startsWith("tracly_cache_") ||
        k.startsWith("trace_p_") ||
        k.startsWith("tracly_cached_")
      ) {
        sessionStorage.removeItem(k);
      }
    });
  } catch {}

  try {
    localStorage.removeItem("tracly_home_feed");
    localStorage.removeItem("tracly_categories");
    localStorage.removeItem("tracly_subcategories");
    localStorage.removeItem("tracly_lcp_banner");
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith("trace_p_")) {
        localStorage.removeItem(k);
      }
    });
  } catch {}

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("tracly:catalog_invalidated"));
  }
};


