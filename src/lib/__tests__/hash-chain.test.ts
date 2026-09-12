import test from 'node:test';
import assert from 'node:assert/strict';
import type { AuditEntry } from '../types.ts';
import { sha256Hex, hashEntry, rechain, verifyChain, GENESIS } from '../hash-chain.ts';

/**
 * The audit chain is the one place in Empreinte where being wrong is silent.
 * A broken hash does not throw; it just stops proving anything. These tests
 * exist so that failure is loud.
 */

const entry = (n: number, over: Partial<AuditEntry> = {}): AuditEntry => ({
    id: `a${n}`,
    timestamp: `2026-05-0${n}T10:00:00.000Z`,
    operator: 'mel',
    action: 'ADMIT',
    targetId: `m${n}`,
    reason: 'member in good standing',
    hash: '',
    previousHash: '',
    ...over,
});

/** Display order is newest-first, which is how the UI hands entries over. */
const chainOf = (count: number) =>
    rechain(Array.from({ length: count }, (_, i) => entry(count - i)));

test('sha256Hex matches the published NIST vectors', () => {
    assert.equal(sha256Hex(''), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    assert.equal(sha256Hex('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    assert.equal(
        sha256Hex('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq'),
        '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1',
    );
});

test('sha256Hex spans the padding boundary correctly', () => {
    // 55, 56 and 64 bytes are where naive SHA-256 padding implementations break.
    assert.equal(sha256Hex('a'.repeat(55)).length, 64);
    assert.equal(sha256Hex('a'.repeat(56)).length, 64);
    assert.equal(sha256Hex('a'.repeat(64)).length, 64);
    assert.notEqual(sha256Hex('a'.repeat(55)), sha256Hex('a'.repeat(56)));
});

test('sha256Hex handles multi-byte characters', () => {
    assert.equal(sha256Hex('café').length, 64);
    assert.notEqual(sha256Hex('café'), sha256Hex('cafe'));
});

test('hashEntry is deterministic and depends on its predecessor', () => {
    const e = entry(1);
    assert.equal(hashEntry(e, GENESIS), hashEntry(e, GENESIS));
    assert.notEqual(hashEntry(e, GENESIS), hashEntry(e, 'f'.repeat(64)));
});

test('hashEntry covers every signed field', () => {
    const base = entry(1);
    const fields: (keyof AuditEntry)[] = ['id', 'timestamp', 'operator', 'action', 'targetId', 'reason'];
    for (const f of fields) {
        const altered = { ...base, [f]: 'tampered' };
        assert.notEqual(
            hashEntry(altered, GENESIS),
            hashEntry(base, GENESIS),
            `changing ${f} must change the signature`,
        );
    }
});

test('rechain anchors the oldest entry at GENESIS', () => {
    const chain = chainOf(3);
    assert.equal(chain[chain.length - 1].previousHash, GENESIS);
});

test('rechain links every entry to the one before it', () => {
    const oldestFirst = [...chainOf(4)].reverse();
    for (let i = 1; i < oldestFirst.length; i++) {
        assert.equal(oldestFirst[i].previousHash, oldestFirst[i - 1].hash);
    }
});

test('verifyChain accepts a chain it built, and an empty one', () => {
    assert.equal(verifyChain(chainOf(5)).ok, true);
    assert.equal(verifyChain(chainOf(1)).ok, true);
    assert.deepEqual(verifyChain([]), { ok: true, checked: 0 });
});

test('verifyChain catches a field edited after the fact', () => {
    const chain = chainOf(4);
    const tampered = [...chain];
    tampered[2] = { ...tampered[2], reason: 'quietly rewritten' };

    const result = verifyChain(tampered);
    assert.equal(result.ok, false);
    assert.equal(result.brokenAt, 2, 'must name the entry that was altered');
    assert.match(result.reason!, /no longer match/);
});

test('verifyChain catches a deleted entry', () => {
    const chain = chainOf(5);
    const withHole = chain.filter((_, i) => i !== 2);

    const result = verifyChain(withHole);
    assert.equal(result.ok, false);
    assert.match(result.reason!, /removed or reordered/);
});

test('verifyChain catches reordering', () => {
    const chain = chainOf(4);
    const swapped = [...chain];
    [swapped[1], swapped[2]] = [swapped[2], swapped[1]];

    assert.equal(verifyChain(swapped).ok, false);
});

test('verifyChain catches a forged tail appended to a real chain', () => {
    const chain = chainOf(3);
    const forged: AuditEntry = {
        ...entry(9, { action: 'OVERRIDE', reason: 'inserted by hand' }),
        previousHash: GENESIS,
        hash: 'f'.repeat(64),
    };
    assert.equal(verifyChain([forged, ...chain]).ok, false);
});

test('re-signing a tampered chain hides the edit, which is why the stored hash is the evidence', () => {
    // rechain() recomputes from contents, so a tampered chain passed through it
    // verifies cleanly. The guarantee lives in comparing against what was stored,
    // not in recomputation. This test pins that behaviour so it cannot drift.
    const chain = chainOf(3);
    const tampered = [...chain];
    tampered[1] = { ...tampered[1], reason: 'rewritten' };

    assert.equal(verifyChain(tampered).ok, false);
    assert.equal(verifyChain(rechain(tampered)).ok, true);
});
