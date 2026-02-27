/**
 * Keywords and patterns for curiosity detection
 */

export interface KeywordPattern {
  /** The keyword or phrase to match */
  pattern: string;
  /** Weight/importance of this keyword (0.0 to 1.0) */
  weight: number;
  /** Category of the keyword */
  category: 'curiosity' | 'question' | 'emotion' | 'exploration';
}

/**
 * Curiosity-related keywords with weights
 */
export const CURIOSITY_KEYWORDS: KeywordPattern[] = [
  // Direct curiosity expressions
  { pattern: 'wonder', weight: 0.9, category: 'curiosity' },
  { pattern: 'curious', weight: 0.9, category: 'curiosity' },
  { pattern: 'wondering', weight: 0.85, category: 'curiosity' },
  { pattern: 'interesting', weight: 0.7, category: 'curiosity' },
  { pattern: 'fascinated', weight: 0.85, category: 'curiosity' },
  { pattern: 'intrigued', weight: 0.8, category: 'curiosity' },
  { pattern: 'puzzled', weight: 0.75, category: 'curiosity' },
  { pattern: 'confused', weight: 0.6, category: 'curiosity' },
  
  // Question indicators
  { pattern: 'why', weight: 0.8, category: 'question' },
  { pattern: 'how', weight: 0.75, category: 'question' },
  { pattern: 'what if', weight: 0.85, category: 'question' },
  { pattern: 'what about', weight: 0.7, category: 'question' },
  { pattern: 'could it be', weight: 0.75, category: 'question' },
  { pattern: 'is it possible', weight: 0.8, category: 'question' },
  { pattern: "i don't understand", weight: 0.7, category: 'question' },
  { pattern: 'what would happen', weight: 0.8, category: 'question' },
  
  // Emotional indicators
  { pattern: 'amazed', weight: 0.75, category: 'emotion' },
  { pattern: 'surprised', weight: 0.7, category: 'emotion' },
  { pattern: 'excited', weight: 0.7, category: 'emotion' },
  { pattern: 'mind-blowing', weight: 0.85, category: 'emotion' },
  { pattern: 'incredible', weight: 0.65, category: 'emotion' },
  { pattern: 'wow', weight: 0.6, category: 'emotion' },
  
  // Exploration keywords
  { pattern: 'explore', weight: 0.75, category: 'exploration' },
  { pattern: 'discover', weight: 0.8, category: 'exploration' },
  { pattern: 'learn', weight: 0.7, category: 'exploration' },
  { pattern: 'investigate', weight: 0.75, category: 'exploration' },
  { pattern: 'research', weight: 0.7, category: 'exploration' },
  { pattern: 'look into', weight: 0.65, category: 'exploration' },
  { pattern: 'dig deeper', weight: 0.75, category: 'exploration' },
  { pattern: 'find out', weight: 0.7, category: 'exploration' },
];

/**
 * Question pattern regex patterns
 */
export const QUESTION_PATTERNS = [
  /\?$/m, // Ends with question mark
  /^(why|how|what|when|where|who|which)\b/im, // Starts with question word
  /\b(could|would|should|might|may)\b.*\?/im, // Modal questions
  /\b(is it|are there|does it|do they|can we|will it)\b/im, // Yes/no questions
];

/**
 * Emotional intensity patterns
 */
export const EMOTIONAL_INTENSITY_PATTERNS = [
  /!+$/, // Exclamation marks
  /\b[A-Z]{2,}\b/, // ALL CAPS words
  /\.\.\./g, // Ellipsis (thinking)
  /\b(really|very|so|extremely|absolutely)\b/i, // Intensity modifiers
];

/**
 * Negation patterns that might reduce confidence
 */
export const NEGATION_PATTERNS = [
  /\b(not|never|no|neither|nor)\b/i,
  /\b(don't|doesn't|didn't|won't|wouldn't|can't|cannot)\b/i,
];

/**
 * Get all patterns by category
 */
export function getKeywordsByCategory(category: KeywordPattern['category']): KeywordPattern[] {
  return CURIOSITY_KEYWORDS.filter(k => k.category === category);
}

/**
 * Get high-weight keywords (threshold: 0.75+)
 */
export function getHighWeightKeywords(): KeywordPattern[] {
  return CURIOSITY_KEYWORDS.filter(k => k.weight >= 0.75);
}
