import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { sha256Hex } from '../hash-chain.ts';

const reference = (s: string) =>
    createHash('sha256').update(s, 'utf8').digest('hex');

test('sha256Hex agrees with platform crypto at every padding boundary', () => {
    // Message lengths 0..130 bytes cross both the 55/56-byte length-field
    // boundary and the 64-byte block boundary, twice.
    for (let len = 0; len <= 130; len++) {
        const msg = 'a'.repeat(len);
        assert.equal(sha256Hex(msg), reference(msg), `length ${len}`);
    }
});

test('sha256Hex agrees with platform crypto on random ASCII', () => {
    for (let i = 0; i < 200; i++) {
        const len = Math.floor(Math.random() * 4096);
        let msg = '';
        for (let j = 0; j < len; j++) {
            msg += String.fromCharCode(32 + Math.floor(Math.random() * 95));
        }
        assert.equal(sha256Hex(msg), reference(msg), `iteration ${i}, length ${len}`);
    }
});

test('sha256Hex agrees with platform crypto on multi-byte unicode', () => {
    const samples = [
        'héllo wörld',
        'こんにちは世界',
        '🔐🧾✅',
        'empreinte — trust layer',
        'a'.repeat(63) + 'é', // multi-byte char straddling a block boundary
        '👨‍👩‍👧‍👦'.repeat(40),   // ZWJ sequences, surrogate pairs
    ];
    for (const msg of samples) {
        assert.equal(sha256Hex(msg), reference(msg), JSON.stringify(msg.slice(0, 20)));
    }
});
