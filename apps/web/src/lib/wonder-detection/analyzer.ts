/**
 * Core wonder detection algorithms
 * Analyzes text to identify curiosity moments and peaks of interest
 */

import {
  CURIOSITY_KEYWORDS,
  QUESTION_PATTERNS,
  EMOTIONAL_INTENSITY_PATTERNS,
  NEGATION_PATTERNS,
  type KeywordPattern,
} from './keywords';

export interface AnalysisResult {
  confidence: number;
  questionPatterns: string[];
  matchedKeywords: string[];
  emotionalIndicators: string[];
}

const ALGORITHM_VERSION = '1.0.0';

/**
 * Analyze text for curiosity indicators
 * Optimized for sub-100ms performance
 */
export function analyzeText(text: string): AnalysisResult {
  if (!text || text.trim().length === 0) {
    return {
      confidence: 0,
      questionPatterns: [],
      matchedKeywords: [],
      emotionalIndicators: [],
    };
  }

  const normalizedText = text.toLowerCase();
  const matchedKeywords: string[] = [];
  const questionPatterns: string[] = [];
  const emotionalIndicators: string[] = [];
  
  let totalWeight = 0;
  let matchCount = 0;

  // Keyword matching - optimized with single pass
  for (const keyword of CURIOSITY_KEYWORDS) {
    if (normalizedText.includes(keyword.pattern)) {
      matchedKeywords.push(keyword.pattern);
      totalWeight += keyword.weight;
      matchCount++;

      // Track emotional indicators
      if (keyword.category === 'emotion') {
        emotionalIndicators.push(keyword.pattern);
      }
    }
  }

  // Question pattern detection
  for (const pattern of QUESTION_PATTERNS) {
    if (pattern.test(text)) {
      questionPatterns.push(pattern.source);
      totalWeight += 0.7; // Bonus for question patterns
    }
  }

  // Emotional intensity detection
  for (const pattern of EMOTIONAL_INTENSITY_PATTERNS) {
    if (pattern.test(text)) {
      totalWeight += 0.3; // Bonus for emotional intensity
    }
  }

  // Check for negations (reduces confidence)
  let negationPenalty = 0;
  for (const pattern of NEGATION_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      negationPenalty += matches.length * 0.15;
    }
  }

  // Calculate base confidence
  let confidence = 0;
  
  if (matchCount > 0) {
    // Average weight of matched keywords
    const avgWeight = totalWeight / Math.max(matchCount + questionPatterns.length, 1);
    
    // Factor in frequency (more matches = higher confidence)
    const frequencyBonus = Math.min(matchCount * 0.1, 0.3);
    
    confidence = Math.min(avgWeight + frequencyBonus, 1.0);
  } else if (questionPatterns.length > 0) {
    // Even without keywords, questions indicate curiosity
    confidence = Math.min(questionPatterns.length * 0.4, 0.7);
  }

  // Apply negation penalty
  confidence = Math.max(0, confidence - negationPenalty);

  // Length normalization (very short texts are less reliable)
  const wordCount = text.split(/\s+/).length;
  if (wordCount < 5) {
    confidence *= 0.7;
  }

  return {
    confidence: Math.min(Math.max(confidence, 0), 1.0),
    questionPatterns,
    matchedKeywords,
    emotionalIndicators,
  };
}

/**
 * Incremental analysis for long texts
 * Splits text into chunks for better performance
 */
export function analyzeTextIncremental(text: string, chunkSize: number = 500): AnalysisResult {
  if (text.length <= chunkSize) {
    return analyzeText(text);
  }

  // Split into chunks at sentence boundaries when possible
  const chunks: string[] = [];
  let currentChunk = '';
  const sentences = text.split(/[.!?]+/);

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? '. ' : '') + sentence;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk);
  }

  // Analyze each chunk and aggregate results
  const allMatchedKeywords = new Set<string>();
  const allQuestionPatterns = new Set<string>();
  const allEmotionalIndicators = new Set<string>();
  let totalConfidence = 0;

  for (const chunk of chunks) {
    const result = analyzeText(chunk);
    totalConfidence += result.confidence;
    result.matchedKeywords.forEach(k => allMatchedKeywords.add(k));
    result.questionPatterns.forEach(p => allQuestionPatterns.add(p));
    result.emotionalIndicators.forEach(e => allEmotionalIndicators.add(e));
  }

  // Average confidence across chunks
  const avgConfidence = totalConfidence / chunks.length;

  return {
    confidence: Math.min(Math.max(avgConfidence, 0), 1.0),
    questionPatterns: Array.from(allQuestionPatterns),
    matchedKeywords: Array.from(allMatchedKeywords),
    emotionalIndicators: Array.from(allEmotionalIndicators),
  };
}

/**
 * Get the algorithm version
 */
export function getAlgorithmVersion(): string {
  return ALGORITHM_VERSION;
}
