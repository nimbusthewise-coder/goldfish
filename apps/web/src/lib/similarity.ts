/**
 * Semantic Similarity Algorithms
 * Provides various methods for calculating similarity between text content
 */

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

/**
 * Calculate Jaccard similarity between two sets
 */
export function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);

  return union.size === 0 ? 0 : intersection.size / union.size;
}

/**
 * Calculate TF-IDF vector for a document
 */
export function calculateTFIDF(
  document: string,
  allDocuments: string[]
): Map<string, number> {
  const terms = tokenize(document);
  const termFrequency = new Map<string, number>();
  const tfidf = new Map<string, number>();

  // Calculate term frequency
  terms.forEach(term => {
    termFrequency.set(term, (termFrequency.get(term) || 0) + 1);
  });

  // Normalize by document length
  terms.forEach(term => {
    const tf = (termFrequency.get(term) || 0) / terms.length;
    const idf = calculateIDF(term, allDocuments);
    tfidf.set(term, tf * idf);
  });

  return tfidf;
}

/**
 * Calculate inverse document frequency
 */
function calculateIDF(term: string, documents: string[]): number {
  const documentsWithTerm = documents.filter(doc =>
    tokenize(doc).includes(term)
  ).length;

  return documentsWithTerm === 0
    ? 0
    : Math.log(documents.length / documentsWithTerm);
}

/**
 * Tokenize text into words
 */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !isStopWord(word));
}

/**
 * Common stop words to filter out
 */
const STOP_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
  'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which',
  'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just',
  'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good',
  'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now',
  'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back',
  'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well',
  'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give',
  'day', 'most', 'us'
]);

function isStopWord(word: string): boolean {
  return STOP_WORDS.has(word.toLowerCase());
}

/**
 * Extract keywords from text using simple frequency analysis
 */
export function extractKeywords(text: string, limit: number = 10): string[] {
  const tokens = tokenize(text);
  const frequency = new Map<string, number>();

  tokens.forEach(token => {
    frequency.set(token, (frequency.get(token) || 0) + 1);
  });

  return Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

/**
 * Calculate semantic similarity between two texts using TF-IDF
 */
export function calculateSemanticSimilarity(
  textA: string,
  textB: string,
  corpus: string[]
): number {
  const tfidfA = calculateTFIDF(textA, corpus);
  const tfidfB = calculateTFIDF(textB, corpus);

  // Get all unique terms
  const allTerms = new Set([...tfidfA.keys(), ...tfidfB.keys()]);

  // Create vectors
  const vecA: number[] = [];
  const vecB: number[] = [];

  allTerms.forEach(term => {
    vecA.push(tfidfA.get(term) || 0);
    vecB.push(tfidfB.get(term) || 0);
  });

  return cosineSimilarity(vecA, vecB);
}

/**
 * Calculate similarity based on shared keywords
 */
export function keywordSimilarity(textA: string, textB: string): number {
  const keywordsA = new Set(extractKeywords(textA, 20));
  const keywordsB = new Set(extractKeywords(textB, 20));

  return jaccardSimilarity(keywordsA, keywordsB);
}

/**
 * Calculate n-grams from text
 */
export function generateNGrams(text: string, n: number): Set<string> {
  const tokens = tokenize(text);
  const ngrams = new Set<string>();

  for (let i = 0; i <= tokens.length - n; i++) {
    ngrams.add(tokens.slice(i, i + n).join(' '));
  }

  return ngrams;
}

/**
 * Calculate similarity using n-gram overlap
 */
export function nGramSimilarity(textA: string, textB: string, n: number = 2): number {
  const ngramsA = generateNGrams(textA, n);
  const ngramsB = generateNGrams(textB, n);

  return jaccardSimilarity(ngramsA, ngramsB);
}

/**
 * Combined similarity score using multiple methods
 */
export function combinedSimilarity(
  textA: string,
  textB: string,
  corpus: string[],
  weights: {
    semantic?: number;
    keyword?: number;
    ngram?: number;
  } = {}
): number {
  const defaultWeights = {
    semantic: 0.5,
    keyword: 0.3,
    ngram: 0.2,
    ...weights
  };

  const semanticScore = calculateSemanticSimilarity(textA, textB, corpus);
  const keywordScore = keywordSimilarity(textA, textB);
  const ngramScore = nGramSimilarity(textA, textB, 2);

  return (
    semanticScore * defaultWeights.semantic +
    keywordScore * defaultWeights.keyword +
    ngramScore * defaultWeights.ngram
  );
}

/**
 * Calculate Levenshtein distance between two strings
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],     // deletion
          dp[i][j - 1],     // insertion
          dp[i - 1][j - 1]  // substitution
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * Normalize Levenshtein distance to similarity score (0-1)
 */
export function levenshteinSimilarity(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1;

  const distance = levenshteinDistance(str1, str2);
  return 1 - (distance / maxLen);
}

/**
 * Create a simple vector embedding from text (bag of words approach)
 */
export function createSimpleEmbedding(text: string, vocabulary: string[]): number[] {
  const tokens = new Set(tokenize(text));
  return vocabulary.map(word => tokens.has(word) ? 1 : 0);
}

/**
 * Build vocabulary from corpus
 */
export function buildVocabulary(corpus: string[], maxSize: number = 1000): string[] {
  const wordFreq = new Map<string, number>();

  corpus.forEach(doc => {
    const tokens = tokenize(doc);
    tokens.forEach(token => {
      wordFreq.set(token, (wordFreq.get(token) || 0) + 1);
    });
  });

  return Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxSize)
    .map(([word]) => word);
}
