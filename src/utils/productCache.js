// Microsecond client-side product cache for instant (0.001ms) rendering
const memoryCache = new Map();

export const setCachedProduct = (id, product) => {
    if (!id || !product) return;
    memoryCache.set(String(id), product);
    try {
        sessionStorage.setItem(`trace_p_${id}`, JSON.stringify(product));
    } catch (e) {
        // Handle quota exceeded gracefully
    }
};

export const getCachedProduct = (id) => {
    if (!id) return null;
    const key = String(id);
    if (memoryCache.has(key)) {
        return memoryCache.get(key);
    }
    try {
        const raw = sessionStorage.getItem(`trace_p_${key}`);
        if (raw) {
            const parsed = JSON.parse(raw);
            memoryCache.set(key, parsed);
            return parsed;
        }
    } catch (e) {
        return null;
    }
    return null;
};
