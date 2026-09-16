import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCorpus } from '../retrieval/corpus.ts';
import { evalQueries } from '../retrieval/eval-set.ts';

test('corpus builds with unique ids and non-empty text', () => {
    const corpus = buildCorpus();
    assert.ok(corpus.length >= 30, `expected a real corpus, got ${corpus.length} chunks`);
    const ids = new Set(corpus.map(c => c.id));
    assert.equal(ids.size, corpus.length, 'duplicate chunk ids');
    for (const c of corpus) {
        assert.ok(c.text.trim().length > 20, `thin chunk: ${c.id}`);
    }
});

test('every eval query has at least one relevant chunk in the corpus', () => {
    const corpus = buildCorpus();
    for (const q of evalQueries) {
        const hits = corpus.filter(q.isRelevant).length;
        assert.ok(hits >= 1, `${q.id} "${q.query}" labels nothing — fix the predicate or the seed`);
    }
});
