import { pipeline, env, type FeatureExtractionPipeline } from '@huggingface/transformers';

/**
 * Self-hosted embeddings: all-MiniLM-L6-v2 running locally via
 * transformers.js. No API, no key; the model (~30 MB) downloads once
 * into .hf-cache and runs on CPU. Vectors are mean-pooled and
 * L2-normalized, so cosine similarity is a plain dot product.
 */
env.cacheDir = '.hf-cache';

const MODEL = 'Xenova/all-MiniLM-L6-v2';

let extractorPromise: Promise<FeatureExtractionPipeline> | null = null;

function getExtractor(): Promise<FeatureExtractionPipeline> {
    extractorPromise ??= pipeline('feature-extraction', MODEL) as Promise<FeatureExtractionPipeline>;
    return extractorPromise;
}

export async function embed(texts: string[]): Promise<number[][]> {
    const extractor = await getExtractor();
    const output = await extractor(texts, { pooling: 'mean', normalize: true });
    return output.tolist() as number[][];
}
