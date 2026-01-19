"use client";

// Layer 1: In-memory LRU Cache
const MEMORY_LIMIT = 50;
const memoryCache = new Map<string, { url: string; expiresAt: number; lastAccessed: number }>();

// Layer 2: IndexedDB
const DB_NAME = 'VideoCacheDB';
const STORE_NAME = 'signedUrls';
const VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB() {
    if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
            if (typeof window === 'undefined') return;

            const request = indexedDB.open(DB_NAME, VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);

            request.onupgradeneeded = (e) => {
                const db = (e.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'reelId' });
                    store.createIndex('expiresAt', 'expiresAt');
                    store.createIndex('lastAccessed', 'lastAccessed');
                }
            };
        });
    }
    return dbPromise;
}

export const VideoCache = {
    async init() {
        if (typeof window === 'undefined') return; // Server side guard

        try {
            const db = await openDB();
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.getAll();

            return new Promise<void>((resolve) => {
                request.onsuccess = () => {
                    const items = request.result;
                    const now = Date.now();

                    // Pull valid entries into memory (up to limit)
                    items
                        .filter((item: any) => item.expiresAt > now)
                        .sort((a: any, b: any) => b.lastAccessed - a.lastAccessed) // Recent first
                        .slice(0, MEMORY_LIMIT)
                        .forEach((item: any) => {
                            memoryCache.set(item.reelId, item);
                        });


                    this.prune();
                    resolve();
                };
            });
        } catch (e) {
            console.warn("VideoCache init failed:", e);
        }
    },

    get(reelId: string): string | null {
        const item = memoryCache.get(reelId);

        // Cache Hit
        if (item) {
            if (item.expiresAt > Date.now()) {
                // Update Last Accessed (In memory)
                item.lastAccessed = Date.now();
                // Move to end (MRU)
                memoryCache.delete(reelId);
                memoryCache.set(reelId, item);

                // Sync access time to IDB lazily (optional, maybe skip for perf)
                return item.url;
            } else {
                // Expired
                memoryCache.delete(reelId);
                this.removeFromDB(reelId);
                return null;
            }

        }
        return null; // Cache Miss
    },

    async save(reelId: string, url: string, expiresAt: number = Date.now() + 7 * 24 * 60 * 60 * 1000) {
        const entry = { reelId, url, expiresAt, lastAccessed: Date.now() };

        // 1. Save to Memory
        if (memoryCache.size >= MEMORY_LIMIT) {
            // Evict LRU (first key)
            const firstKey = memoryCache.keys().next().value;
            if (firstKey) memoryCache.delete(firstKey);
        }
        memoryCache.set(reelId, entry);

        // 2. Save to IDB
        try {
            const db = await openDB();
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).put(entry);
        } catch (e) {
            console.error("IDB Save failed", e);
        }
    },

    async removeFromDB(reelId: string) {
        try {
            const db = await openDB();
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).delete(reelId);
        } catch (e) { }
    },

    async prune() {
        // Remove expired or > 7 days untouched
        try {
            const db = await openDB();
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const index = store.index('expiresAt');
            const now = Date.now();

            // Delete expired
            const expiredReq = index.openCursor(IDBKeyRange.upperBound(now));
            expiredReq.onsuccess = () => {
                const cursor = expiredReq.result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                }
            };

            // Delete stale (not accessed in 7 days)
            const staleThreshold = now - 7 * 24 * 60 * 60 * 1000;
            const accessIndex = store.index('lastAccessed');
            const staleReq = accessIndex.openCursor(IDBKeyRange.upperBound(staleThreshold));
            staleReq.onsuccess = () => {
                const cursor = staleReq.result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                }
            };
        } catch (e) { }
    }
};
