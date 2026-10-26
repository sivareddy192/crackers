const memoryCache = new Map();

export const setCachedProduct = (id, product) => {
    if (!id || !product) return;
    memoryCache.set(String(id), product);
    try {
        const serialized = JSON.stringify(product);
        sessionStorage.setItem(`trace_p_${id}`, serialized);
        localStorage.setItem(`trace_p_${id}`, serialized);
    } catch (e) {
    }
};

export const getCachedProduct = (id) => {
    if (!id) return null;
    const key = String(id);
    if (memoryCache.has(key)) {
        return memoryCache.get(key);
    }
    try {
        const raw = sessionStorage.getItem(`trace_p_${key}`) || localStorage.getItem(`trace_p_${key}`);
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

