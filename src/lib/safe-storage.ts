/**
 * Web storage that cannot take the page down.
 *
 * Safari in Private Browsing throws on setItem (and some locked-down
 * configurations throw on merely touching the object). An unguarded call
 * during render or an effect takes the whole app with it, so every access
 * goes through here.
 */

type Kind = 'local' | 'session';

function store(kind: Kind): Storage | null {
    try {
        const s = kind === 'local' ? window.localStorage : window.sessionStorage;
        // Touch it — some environments only throw on first use.
        const probe = '__empreinte_probe__';
        s.setItem(probe, '1');
        s.removeItem(probe);
        return s;
    } catch {
        return null;
    }
}

// In-memory fallback so behaviour stays coherent for the life of the page
// even when persistence is unavailable.
const memory: Record<Kind, Map<string, string>> = {
    local: new Map(),
    session: new Map(),
};

export const safeStorage = {
    get(kind: Kind, key: string): string | null {
        const s = store(kind);
        if (!s) return memory[kind].get(key) ?? null;
        try { return s.getItem(key); } catch { return memory[kind].get(key) ?? null; }
    },
    set(kind: Kind, key: string, value: string): void {
        memory[kind].set(key, value);
        const s = store(kind);
        if (!s) return;
        try { s.setItem(key, value); } catch { /* quota or private mode — memory holds it */ }
    },
    remove(kind: Kind, key: string): void {
        memory[kind].delete(key);
        const s = store(kind);
        if (!s) return;
        try { s.removeItem(key); } catch { /* nothing to do */ }
    },
};
