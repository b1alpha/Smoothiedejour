/**
 * Heuristic-based ingredient classification for detecting nuts and fat content.
 * Uses keyword matching with include/exclude lists applied per-ingredient.
 */

import keywordsConfig from '../../scripts/ingredient-classifier-keywords.json';

export interface Keywords {
  include: string[];
  exclude: string[];
}

export interface KeywordsConfig {
  version: string;
  nuts: Keywords;
  fat: Keywords;
  notes?: Record<string, unknown>;
}

export interface MatchResult {
  matches: boolean;
  matchedIncludes: string[];
  matchedExcludes: string[];
}

export interface ClassificationResult {
  containsNuts: boolean;
  containsFat: boolean;
  nutDetails: { matchedIncludes: string[]; matchedExcludes: string[] };
  fatDetails: { matchedIncludes: string[]; matchedExcludes: string[] };
}

// Export the loaded config for reference
export const config: KeywordsConfig = keywordsConfig as KeywordsConfig;

/**
 * Normalize an ingredient string for keyword matching:
 * - lowercase
 * - remove punctuation except hyphens
 * - collapse whitespace
 */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')  // Remove punctuation except hyphens
    .replace(/\s+/g, ' ')        // Collapse whitespace
    .trim();
}

/**
 * Check if normalized text contains a keyword.
 * Uses word boundary matching to avoid partial matches.
 */
export function containsKeyword(normalizedText: string, keyword: string): boolean {
  const normalizedKeyword = normalize(keyword);
  // Create a regex with word boundaries, allowing hyphens to be optional/spaces
  const regex = new RegExp(`\\b${normalizedKeyword.replace(/-/g, '[-\\s]?')}\\b`, 'i');
  return regex.test(normalizedText);
}

// Raw patterns to check BEFORE normalization (patterns that would be lost after normalization)
const RAW_FAT_EXCLUDES = [
  /\b0\s*%/i,  // "0%" or "0 %" - indicates zero fat content
];

/**
 * Check ingredients against a keywords list.
 * Returns true if any ingredient matches an include keyword WITHOUT also matching an exclude.
 * Excludes are applied per-ingredient, not globally.
 */
export function matchesKeywords(ingredients: string[], keywords: Keywords, rawExcludes: RegExp[] = []): MatchResult {
  const matchedIncludes: string[] = [];
  const matchedExcludes: string[] = [];

  for (const ingredient of ingredients) {
    const normalized = normalize(ingredient);

    // Check raw patterns first (before normalization would strip special chars)
    let isExcluded = false;
    for (const rawPattern of rawExcludes) {
      if (rawPattern.test(ingredient)) {
        matchedExcludes.push(`"${ingredient}" excluded by raw pattern "${rawPattern.source}"`);
        isExcluded = true;
        break;
      }
    }

    // Check normalized excludes
    if (!isExcluded) {
      for (const exclude of keywords.exclude) {
        if (containsKeyword(normalized, exclude)) {
          matchedExcludes.push(`"${ingredient}" excluded by "${exclude}"`);
          isExcluded = true;
          break; // One exclude is enough to skip this ingredient
        }
      }
    }

    // Only check includes if this ingredient wasn't excluded
    if (!isExcluded) {
      for (const include of keywords.include) {
        if (containsKeyword(normalized, include)) {
          matchedIncludes.push(`"${ingredient}" matched "${include}"`);
          break; // One match per ingredient is enough
        }
      }
    }
  }

  // Match if we have any non-excluded includes
  const matches = matchedIncludes.length > 0;

  return { matches, matchedIncludes, matchedExcludes };
}

/**
 * Classify a recipe's ingredients for nuts and fat content.
 */
export function classifyIngredients(ingredients: string[]): ClassificationResult {
  const nutResult = matchesKeywords(ingredients, config.nuts);
  // Fat detection uses raw excludes for patterns like "0%" that get lost after normalization
  const fatResult = matchesKeywords(ingredients, config.fat, RAW_FAT_EXCLUDES);

  return {
    containsNuts: nutResult.matches,
    containsFat: fatResult.matches,
    nutDetails: { matchedIncludes: nutResult.matchedIncludes, matchedExcludes: nutResult.matchedExcludes },
    fatDetails: { matchedIncludes: fatResult.matchedIncludes, matchedExcludes: fatResult.matchedExcludes },
  };
}
