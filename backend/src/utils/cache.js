const logger = require("../config/logger");

/**
 * Abstract Base Cache Interface
 */
class BaseCacheProvider {
    async get(key) { throw new Error("Method not implemented"); }
    async set(key, value, ttlSeconds) { throw new Error("Method not implemented"); }
    async delete(key) { throw new Error("Method not implemented"); }
    async clear() { throw new Error("Method not implemented"); }
    async invalidateByTag(tag) { throw new Error("Method not implemented"); }
}

/**
 * In-Memory TTL Cache with Tag Invalidation
 */
class MemoryCacheProvider extends BaseCacheProvider {
    constructor() {
        super();
        this.cache = new Map(); // key -> { value, expiresAt }
        this.tagMap = new Map(); // tag -> Set(keys)
        this.keyTags = new Map(); // key -> Set(tags)
        logger.info("Initialized MemoryCacheProvider backend");
    }

    async get(key) {
        const entry = this.cache.get(key);
        if (!entry) return null;

        if (Date.now() > entry.expiresAt) {
            await this.delete(key);
            return null;
        }
        return entry.value;
    }

    async set(key, value, ttlSeconds = 300, tags = []) {
        const expiresAt = Date.now() + (ttlSeconds * 1000);
        this.cache.set(key, { value, expiresAt });

        // Handle tag relationships
        if (tags && tags.length > 0) {
            if (!this.keyTags.has(key)) {
                this.keyTags.set(key, new Set());
            }
            const kTags = this.keyTags.get(key);

            for (const tag of tags) {
                kTags.add(tag);
                if (!this.tagMap.has(tag)) {
                    this.tagMap.set(tag, new Set());
                }
                this.tagMap.get(tag).add(key);
            }
        }
    }

    async delete(key) {
        this.cache.delete(key);

        // Clean up tags references
        const tags = this.keyTags.get(key);
        if (tags) {
            for (const tag of tags) {
                const keysForTag = this.tagMap.get(tag);
                if (keysForTag) {
                    keysForTag.delete(key);
                    if (keysForTag.size === 0) {
                        this.tagMap.delete(tag);
                    }
                }
            }
            this.keyTags.delete(key);
        }
    }

    async clear() {
        this.cache.clear();
        this.tagMap.clear();
        this.keyTags.clear();
        logger.info("MemoryCacheProvider cleared entirely");
    }

    async invalidateByTag(tag) {
        const keys = this.tagMap.get(tag);
        if (!keys) return;

        logger.info({ tag }, `Invalidating cache for key tag: ${tag}`);
        const keysArray = Array.from(keys);
        for (const key of keysArray) {
            await this.delete(key);
        }
        this.tagMap.delete(tag);
    }
}

/**
 * Stub Redis Provider for future compatibility
 */
class RedisCacheProvider extends BaseCacheProvider {
    constructor() {
        super();
        logger.warn("Initializing RedisCacheProvider [STUB PLACEHOLDER mode]");
        this.simulatedMemory = new MemoryCacheProvider();
    }

    async get(key) {
        logger.info({ key }, `Redis GET [mocked]: ${key}`);
        return this.simulatedMemory.get(key);
    }

    async set(key, value, ttlSeconds = 300, tags = []) {
        logger.info({ key, ttlSeconds, tags }, `Redis SET [mocked]: ${key}`);
        return this.simulatedMemory.set(key, value, ttlSeconds, tags);
    }

    async delete(key) {
        logger.info({ key }, `Redis DEL [mocked]: ${key}`);
        return this.simulatedMemory.delete(key);
    }

    async clear() {
        logger.info("Redis FLUSHALL [mocked]");
        return this.simulatedMemory.clear();
    }

    async invalidateByTag(tag) {
        logger.info({ tag }, `Redis INVALIDATING TAG [mocked]: ${tag}`);
        return this.simulatedMemory.invalidateByTag(tag);
    }
}

/**
 * Fallback No-Operation Cache Provider (skips caching)
 */
class NoOpCacheProvider extends BaseCacheProvider {
    async get(key) { return null; }
    async set(key, value, ttlSeconds) { return; }
    async delete(key) { return; }
    async clear() { return; }
    async invalidateByTag(tag) { return; }
}

// Factory instantiation
const getCacheInstance = () => {
    const isEnabled = process.env.ENABLE_CACHE === "true";
    const provider = (process.env.CACHE_PROVIDER || "memory").toLowerCase();

    if (!isEnabled || provider === "none" || provider === "noop") {
        return new NoOpCacheProvider();
    }

    switch (provider) {
        case "redis":
            return new RedisCacheProvider();
        case "memory":
        default:
            return new MemoryCacheProvider();
    }
};

const cache = getCacheInstance();
module.exports = cache;
