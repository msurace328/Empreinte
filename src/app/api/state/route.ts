import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/server/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Namespaced per environment. Without this, a local dev server holding the
// same KV credentials reads and writes the *production* session — local
// testing would silently mutate what visitors see.
const ENV = process.env.VERCEL_ENV ?? 'local';
const KEY = `empreinte:session:${ENV}`;
const MAX_BYTES = 512 * 1024;

// GET /api/state — returns the persisted session, or null on a fresh install.
export async function GET() {
    try {
        const store = getStore();
        const data = await store.get(KEY);
        return NextResponse.json({ data, backend: store.kind });
    } catch (e) {
        return NextResponse.json(
            { data: null, backend: 'unavailable', error: e instanceof Error ? e.message : 'read failed' },
            { status: 200 },
        );
    }
}

// PUT /api/state — replaces the persisted session.
export async function PUT(req: NextRequest) {
    try {
        const body = await req.text();
        if (body.length > MAX_BYTES) {
            return NextResponse.json({ ok: false, error: 'Session payload too large.' }, { status: 413 });
        }
        const store = getStore();
        await store.set(KEY, JSON.parse(body));
        return NextResponse.json({ ok: true, backend: store.kind });
    } catch (e) {
        return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'write failed' }, { status: 500 });
    }
}

// DELETE /api/state — resets to seed data.
export async function DELETE() {
    try {
        const store = getStore();
        await store.del(KEY);
        return NextResponse.json({ ok: true, backend: store.kind });
    } catch (e) {
        return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'delete failed' }, { status: 500 });
    }
}
