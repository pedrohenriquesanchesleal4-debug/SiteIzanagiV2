import ragIndexData from "@/content/rag-index.json";

interface RagChunk {
  id: string;
  source: string;
  text: string;
  embedding: number[];
}

const ragIndex = ragIndexData as { model: string; dimensions: number; chunks: RagChunk[] };

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function retrieveContext(queryEmbedding: number[], topK = 6) {
  const scored = ragIndex.chunks.map((chunk) => ({
    chunk,
    score: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK).map((s) => s.chunk);
}

export const RAG_EMBED_MODEL = ragIndex.model;
