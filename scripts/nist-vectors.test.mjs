// NIST FIPS 180-4 SHA-256 known-answer tests + audit-chain integrity check
// Run: node scripts/nist-vectors.test.mjs
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const sha256 = (data) => createHash('sha256').update(data).digest('hex');

// --- NIST FIPS 180-4 test vectors ---
const vectors = [
  {
    msg: '',
    hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    name: 'empty string',
  },
  {
    msg: 'abc',
    hash: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    name: 'abc',
  },
  {
    msg: 'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq',
    hash: '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1',
    name: '448-bit message',
  },
  {
    msg: 'a'.repeat(1_000_000),
    hash: 'cdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0',
    name: 'one million a',
  },
];

console.log('SHA-256 vs NIST FIPS 180-4 vectors');
for (const v of vectors) {
  assert.equal(sha256(v.msg), v.hash, `FAILED: ${v.name}`);
  console.log(`  PASS  ${v.name}`);
}

// --- Audit chain integrity ---
// Chain rule: entryHash = sha256(prevHash + JSON.stringify(payload))
const chainHash = (prevHash, payload) =>
  sha256(prevHash + JSON.stringify(payload));

const GENESIS = sha256('empreinte-genesis');
const entries = [
  { action: 'APPLICANT_FLAGGED', actor: 'system', reason: 'synthetic photo' },
  { action: 'MEMBER_RESTRICTED', actor: 'admin', reason: 'referral ring' },
  { action: 'RESTRICTION_REVIEWED', actor: 'admin', reason: 'upheld' },
];

let prev = GENESIS;
const chain = entries.map((payload) => {
  const hash = chainHash(prev, payload);
  const link = { payload, prev, hash };
  prev = hash;
  return link;
});

// Verify intact chain
let ok = chain.every(
  (link, i) =>
    link.prev === (i === 0 ? GENESIS : chain[i - 1].hash) &&
    link.hash === chainHash(link.prev, link.payload)
);
assert.equal(ok, true, 'FAILED: intact chain did not verify');
console.log('  PASS  intact chain verifies');

// Verify tampering is detected
const tampered = structuredClone(chain);
tampered[1].payload.reason = 'edited after the fact';
ok = tampered.every(
  (link, i) =>
    link.prev === (i === 0 ? GENESIS : tampered[i - 1].hash) &&
    link.hash === chainHash(link.prev, link.payload)
);
assert.equal(ok, false, 'FAILED: tampering was not detected');
console.log('  PASS  tampered entry detected');

console.log('\nAll checks passed.');
