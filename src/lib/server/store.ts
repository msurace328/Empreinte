/**
 * Server-side session store.
 *
 * Empreinte has no database by design — it ships as a working demo. This module
 * is the single seam where that changes: implement `Store` against Postgres,
 * Redis, or Vercel KV and the whole app persists server-side with no other edits.
 *
 * Resolution order:
 *   1. Vercel KV / Upstash Redis, if KV_REST_API_URL + KV_REST_API_TOKEN are set.
 *   2. In-process memory, otherwise. Survives navigation within a running
 *      server; does NOT survive a serverless cold start. The client also keeps
 *      a localStorage mirror, so a demo still behaves correctly either way.
 */

export interface Store {
    get(key: string): Promise<unknown | null>;
    set(key: string, value: unknown): Promise<void>;
    del(key: string): Promise<void>;
    readonly kind: 'kv' | 'memory';
}

const memory = new Map<string, unknown>();

const memoryStore: Store = {
    kind: 'memory',
    async get(key) { return memory.has(key) ? memory.get(key) : null; },
    async set(key, value) { memory.set(key, value); },
    async del(key) { memory.delete(key); },
};

function kvStore(url: string, token: string): Store {
    const call = async (path: string, init?: RequestInit) => {
        const res = await fetch(`${url}/${path}`, {
            ...init,
            headers: { Authorization: `Bearer ${token}`, ...(init?.headers ?? {}) },
            cache: 'no-store',
        });
        if (!res.ok) throw new Error(`KV ${path} failed: ${res.status}`);
        return res.json() as Promise<{ result: string | null }>;
    };

    return {
        kind: 'kv',
        async get(key) {
            const { result } = await call(`get/${encodeURIComponent(key)}`);
            if (result == null) return null;
            try { return JSON.parse(result); } catch { return null; }
        },
        async set(key, value) {
            await call(`set/${encodeURIComponent(key)}`, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(value),
            });
        },
        async del(key) {
            await call(`del/${encodeURIComponent(key)}`, { method: 'POST' });
        },
    };
}

export function getStore(): Store {
    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;
    if (url && token) return kvStore(url, token);
    return memoryStore;
}
