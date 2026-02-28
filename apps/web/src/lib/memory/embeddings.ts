/**
 * Vector embedding generation for semantic memory search
 * Uses a simple local TF-IDF approach that can be enhanced with OpenAI embeddings
 */

import type { EmbeddingConfig } from '@/types/memory';

const DEFAULT_DIMENSIONS = 128;

/**
 * Simple tokenizer for text processing
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 2);
}

/**
 * Stop words to filter out
 */
const STOP_WORDS = new Set([
  'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but',
  'in', 'with', 'to', 'for', 'of', 'as', 'by', 'this', 'that', 'it',
  'from', 'be', 'are', 'was', 'were', 'been', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might'
]);

/**
 * Generate local embedding using TF-IDF approach
 */
function generateLocalEmbedding(text: string, dimensions: number = DEFAULT_DIMENSIONS): number[] {
  const tokens = tokenize(text).filter(token => !STOP_WORDS.has(token));
  
  if (tokens.length === 0) {
    return new Array(dimensions).fill(0);
  }

  // Create a simple hash-based embedding
  const embedding = new Array(dimensions).fill(0);
  
  tokens.forEach(token => {
    // Simple hash function to map tokens to dimensions
    const hash = simpleHash(token);
    const index = Math.abs(hash) % dimensions;
    embedding[index] += 1;
  });

  // Normalize the vector
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    return embedding.map(val => val / magnitude);
  }

  return embedding;
}

/**
 * Simple hash function for consistent token mapping
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash;
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    mag1 += vec1[i] * vec1[i];
    mag2 += vec2[i] * vec2[i];
  }

  const magnitude = Math.sqrt(mag1) * Math.sqrt(mag2);
  if (magnitude === 0) return 0;

  return dotProduct / magnitude;
}

/**
 * Generate embedding based on configuration
 */
export async function generateEmbedding(
  text: string,
  config: EmbeddingConfig = { model: 'local', dimensions: DEFAULT_DIMENSIONS }
): Promise<number[]> {
  if (config.model === 'openai' && config.apiKey) {
    // Future: implement OpenAI embeddings
    // For now, fall back to local
    console.warn('OpenAI embeddings not yet implemented, using local embeddings');
    return generateLocalEmbedding(text, config.dimensions);
  }

  return generateLocalEmbedding(text, config.dimensions);
}

/**
 * Batch generate embeddings for multiple texts
 */
export async function batchGenerateEmbeddings(
  texts: string[],
  config: EmbeddingConfig = { model: 'local', dimensions: DEFAULT_DIMENSIONS }
): Promise<number[][]> {
  // Process in parallel for better performance
  return Promise.all(texts.map(text => generateEmbedding(text, config)));
}

/**
 * Find most similar embeddings from a set
 */
export function findSimilar(
  queryEmbedding: number[],
  embeddings: { id: string; embedding: number[] }[],
  limit: number = 10,
  minSimilarity: number = 0.5
): Array<{ id: string; similarity: number }> {
  const similarities = embeddings.map(({ id, embedding }) => ({
    id,
    similarity: cosineSimilarity(queryEmbedding, embedding)
  }));

  return similarities
    .filter(result => result.similarity >= minSimilarity)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

/**
 * Extract keywords from text for quick matching
 */
export function extractKeywords(text: string, limit: number = 10): string[] {
  const tokens = tokenize(text).filter(token => !STOP_WORDS.has(token));
  
  // Count token frequencies
  const frequencies = new Map<string, number>();
  tokens.forEach(token => {
    frequencies.set(token, (frequencies.get(token) || 0) + 1);
  });

  // Sort by frequency and return top keywords
  return Array.from(frequencies.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([token]) => token);
}

/**
 * Calculate text similarity using Jaccard index (for quick comparison)
 */
export function jaccardSimilarity(text1: string, text2: string): number {
  const tokens1 = new Set(tokenize(text1).filter(token => !STOP_WORDS.has(token)));
  const tokens2 = new Set(tokenize(text2).filter(token => !STOP_WORDS.has(token)));

  const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
  const union = new Set([...tokens1, ...tokens2]);

  if (union.size === 0) return 0;
  return intersection.size / union.size;
}
