// Retrieval evaluation: Recall@5, Recall@10, MRR over the labeled set in
// src/lib/retrieval/eval-set.ts, against the corpus in corpus.ts, using
// self-hosted MiniLM embeddings and hybrid (dense + lexical, RRF) search.
// Run: npm run eval:retrieval
import { buildCorpus } from '../src/lib/retrieval/corpus.ts';
import { evalQueries } from '../src/lib/retrieval/eval-set.ts';
import { embed } from '../src/lib/retrieval/embedder.ts';
import { hybridSearch } from '../src/lib/retrieval/search.ts';

const corpus = buildCorpus();
console.log(`corpus: ${corpus.length} chunks; queries: ${evalQueries.length}`);
console.log('embedding corpus (first run downloads the model)...');

const t0 = Date.now();
const corpusVecs = await embed(corpus.map(c => c.text));
const embeddings = new Map(corpus.map((c, i) => [c.id, corpusVecs[i]]));
const queryVecs = await embed(evalQueries.map(q => q.query));
console.log(`embedded in ${((Date.now() - t0) / 1000).toFixed(1)}s\n`);

let sumR5 = 0, sumR10 = 0, sumMRR = 0;
const rows = [];

evalQueries.forEach((q, qi) => {
    const relevant = new Set(corpus.filter(q.isRelevant).map(c => c.id));
    const results = hybridSearch(queryVecs[qi], q.query, corpus, embeddings, 10);
    const ids = results.map(r => r.chunk.id);

    const hitsAt = (k) => ids.slice(0, k).filter(id => relevant.has(id)).length;
    const r5 = hitsAt(5) / relevant.size;
    const r10 = hitsAt(10) / relevant.size;
    const firstRel = ids.findIndex(id => relevant.has(id));
    const mrr = firstRel === -1 ? 0 : 1 / (firstRel + 1);

    sumR5 += r5; sumR10 += r10; sumMRR += mrr;
    rows.push({ id: q.id, rel: relevant.size, 'R@5': r5.toFixed(2), 'R@10': r10.toFixed(2), MRR: mrr.toFixed(2), query: q.query });
});

console.table(rows);
const n = evalQueries.length;
const R5 = sumR5 / n, R10 = sumR10 / n, MRR = sumMRR / n;
console.log(`\nMacro Recall@5:  ${R5.toFixed(3)}`);
console.log(`Macro Recall@10: ${R10.toFixed(3)}`);
console.log(`Macro MRR:       ${MRR.toFixed(3)}`);
console.log('\nNote: recall denominators are the full relevant-set size, so');
console.log('queries with more than k relevant chunks cap below 1.0 by design.');

// CI gate: --assert fails the process below these floors, so corpus or
// search changes that degrade retrieval break the build.
if (process.argv.includes('--assert')) {
    const FLOOR_R10 = 0.9, FLOOR_MRR = 0.85;
    if (R10 < FLOOR_R10 || MRR < FLOOR_MRR) {
        console.error(`\nFAIL: Recall@10 ${R10.toFixed(3)} (floor ${FLOOR_R10}) / MRR ${MRR.toFixed(3)} (floor ${FLOOR_MRR})`);
        process.exit(1);
    }
    console.log('\nRetrieval floors held.');
}
