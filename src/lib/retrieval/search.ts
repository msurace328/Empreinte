import type { Chunk } from './corpus.ts';

/**
 * Hybrid retrieval over an in-process index: dense cosine ranking and
 * lexical keyword ranking, fused with Reciprocal Rank Fusion, with
 * optional structured metadata filtering applied before ranking.
 */
export interface Scored {
    chunk: Chunk;
    score: number;
}

export type MetadataFilter = Partial<Chunk['metadata']>;

const dot = (a: number[], b: number[]) => {
    let s = 0;
    for (let i = 0; i < a.length; i++) s += a[i] * b[i];
    return s;
};

const tokenize = (s: string) =>
    s.toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length > 2);

function keywordScore(queryTokens: string[], text: string): number {
    const hay = text.toLowerCase();
    let hits = 0;
    for (const t of queryTokens) if (hay.includes(t)) hits++;
    return queryTokens.length ? hits / queryTokens.length : 0;
}

function applyFilter(chunks: Chunk[], filter?: MetadataFilter): Set<string> {
    const allowed = new Set<string>();
    for (const c of chunks) {
        if (filter && Object.entries(filter).some(
            ([k, v]) => v !== undefined && c.metadata[k as keyof Chunk['metadata']] !== v,
        )) continue;
        allowed.add(c.id);
    }
    return allowed;
}

/** RRF: score = sum over rankings of 1 / (K + rank). Standard K = 60. */
const RRF_K = 60;

export function hybridSearch(
    queryEmbedding: number[],
    queryText: string,
    chunks: Chunk[],
    embeddings: Map<string, number[]>,
    k: number,
    filter?: MetadataFilter,
): Scored[] {
    const allowed = applyFilter(chunks, filter);
    const candidates = chunks.filter(c => allowed.has(c.id));

    const denseRanked = [...candidates].sort((a, b) =>
        dot(queryEmbedding, embeddings.get(b.id)!) - dot(queryEmbedding, embeddings.get(a.id)!));

    const qTokens = tokenize(queryText);
    const lexicalRanked = [...candidates].sort((a, b) =>
        keywordScore(qTokens, b.text) - keywordScore(qTokens, a.text));

    const rrf = new Map<string, number>();
    denseRanked.forEach((c, i) => rrf.set(c.id, (rrf.get(c.id) ?? 0) + 1 / (RRF_K + i + 1)));
    lexicalRanked.forEach((c, i) => rrf.set(c.id, (rrf.get(c.id) ?? 0) + 1 / (RRF_K + i + 1)));

    return candidates
        .map(c => ({ chunk: c, score: rrf.get(c.id) ?? 0 }))
        .sort((a, b) => b.score - a.score)
        .slice(0, k);
}
