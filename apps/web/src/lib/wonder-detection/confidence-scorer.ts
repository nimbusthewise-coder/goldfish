/**
 * Confidence scoring system for wonder detection
 * Provides thresholds and confidence-based classification
 */

export enum ConfidenceLevel {
  NONE = 'none',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high',
}

export interface ConfidenceThresholds {
  low: number;
  medium: number;
  high: number;
  veryHigh: number;
}

/**
 * Default confidence thresholds
 */
export const DEFAULT_THRESHOLDS: ConfidenceThresholds = {
  low: 0.3,
  medium: 0.5,
  high: 0.7,
  veryHigh: 0.85,
};

/**
 * Minimum confidence to be considered a curiosity moment
 */
export const CURIOSITY_THRESHOLD = 0.5;

/**
 * Classify confidence score into a level
 */
export function getConfidenceLevel(
  confidence: number,
  thresholds: ConfidenceThresholds = DEFAULT_THRESHOLDS
): ConfidenceLevel {
  if (confidence >= thresholds.veryHigh) {
    return ConfidenceLevel.VERY_HIGH;
  } else if (confidence >= thresholds.high) {
    return ConfidenceLevel.HIGH;
  } else if (confidence >= thresholds.medium) {
    return ConfidenceLevel.MEDIUM;
  } else if (confidence >= thresholds.low) {
    return ConfidenceLevel.LOW;
  }
  return ConfidenceLevel.NONE;
}

/**
 * Check if confidence score indicates a curiosity moment
 */
export function isCuriosityMoment(
  confidence: number,
  threshold: number = CURIOSITY_THRESHOLD
): boolean {
  return confidence >= threshold;
}

/**
 * Normalize confidence score to ensure it's within 0.0-1.0
 */
export function normalizeConfidence(confidence: number): number {
  return Math.min(Math.max(confidence, 0), 1.0);
}

/**
 * Calculate weighted confidence from multiple factors
 */
export function calculateWeightedConfidence(factors: {
  keywordScore: number;
  questionScore: number;
  emotionScore: number;
  weights?: { keyword: number; question: number; emotion: number };
}): number {
  const defaultWeights = {
    keyword: 0.5,
    question: 0.3,
    emotion: 0.2,
  };

  const weights = factors.weights || defaultWeights;

  const weightedScore =
    factors.keywordScore * weights.keyword +
    factors.questionScore * weights.question +
    factors.emotionScore * weights.emotion;

  return normalizeConfidence(weightedScore);
}

/**
 * Adjust confidence based on context factors
 */
export function adjustConfidence(
  baseConfidence: number,
  adjustments: {
    textLength?: number;
    negationCount?: number;
    capitalizedWords?: number;
  }
): number {
  let adjusted = baseConfidence;

  // Penalize very short text
  if (adjustments.textLength !== undefined && adjustments.textLength < 10) {
    adjusted *= 0.8;
  }

  // Penalize high negation usage
  if (adjustments.negationCount !== undefined && adjustments.negationCount > 0) {
    adjusted *= Math.max(0.5, 1 - adjustments.negationCount * 0.1);
  }

  // Boost for capitalized words (excitement indicator)
  if (adjustments.capitalizedWords !== undefined && adjustments.capitalizedWords > 0) {
    adjusted *= 1 + Math.min(adjustments.capitalizedWords * 0.05, 0.2);
  }

  return normalizeConfidence(adjusted);
}

/**
 * Get color representation for confidence level (for UI visualization)
 */
export function getConfidenceLevelColor(level: ConfidenceLevel): string {
  switch (level) {
    case ConfidenceLevel.VERY_HIGH:
      return '#10b981'; // Green
    case ConfidenceLevel.HIGH:
      return '#3b82f6'; // Blue
    case ConfidenceLevel.MEDIUM:
      return '#f59e0b'; // Amber
    case ConfidenceLevel.LOW:
      return '#ef4444'; // Red
    case ConfidenceLevel.NONE:
    default:
      return '#6b7280'; // Gray
  }
}

/**
 * Get confidence score as percentage string
 */
export function getConfidencePercentage(confidence: number): string {
  return `${Math.round(normalizeConfidence(confidence) * 100)}%`;
}
