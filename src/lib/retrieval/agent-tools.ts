import { buildCorpus, type Chunk } from './corpus.ts';
import { embed } from './embedder.ts';
import { hybridSearch, type MetadataFilter } from './search.ts';

/**
 * Tool layer for the Revenue AI agent. Exposes the same hybrid retrieval
 * that backs trust search as a callable tool, so the model can inspect
 * underlying records instead of reasoning only from a pre-built summary.
 * The corpus is embedded once per server instance and cached.
 */
let indexPromise: Promise<{ chunks: Chunk[]; embeddings: Map<string, number[]> }> | null = null;

function getIndex() {
    indexPromise ??= (async () => {
        const chunks = buildCorpus();
        const vecs = await embed(chunks.map(c => c.text));
        return { chunks, embeddings: new Map(chunks.map((c, i) => [c.id, vecs[i]])) };
    })();
    return indexPromise;
}

export const toolDefinitions = [
    {
        name: 'search_operations',
        description:
            'Search the club\'s operational records (member dossiers, applications, access anomalies, revenue opportunities, audit entries, suite bookings, guest requests, message threads) with hybrid semantic and keyword retrieval. Use it to verify or discover specifics before making a recommendation.',
        input_schema: {
            type: 'object' as const,
            properties: {
                query: { type: 'string', description: 'Natural language search query' },
                kind: {
                    type: 'string',
                    enum: ['member', 'application', 'anomaly', 'opportunity', 'audit', 'booking', 'guest', 'thread'],
                    description: 'Optional: restrict to one record type',
                },
                status: { type: 'string', description: 'Optional: restrict to one status value, e.g. NoShow, Refunded, Open' },
                k: { type: 'integer', description: 'How many results (default 5, max 10)' },
            },
            required: ['query'],
        },
    },
];

export async function runTool(name: string, input: Record<string, unknown>): Promise<string> {
    if (name !== 'search_operations') {
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
    const { chunks, embeddings } = await getIndex();
    const query = String(input.query ?? '');
    const k = Math.min(Number(input.k ?? 5) || 5, 10);
    const filter: MetadataFilter = {};
    if (typeof input.kind === 'string') filter.kind = input.kind as Chunk['metadata']['kind'];
    if (typeof input.status === 'string') filter.status = input.status;

    const [queryVec] = await embed([query]);
    const results = hybridSearch(queryVec, query, chunks, embeddings, k, filter);
    return JSON.stringify(
        results.map(r => ({ id: r.chunk.id, text: r.chunk.text })),
    );
}
