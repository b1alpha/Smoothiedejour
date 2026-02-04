/**
 * Parses a pasted string of ingredients into an array of individual ingredients.
 * Handles various formats:
 * - Newline-separated
 * - Bullet points (•, -, *, ·)
 * - Numbered lists (1., 2., 1), 2), etc.)
 * - Comma-separated (only if no newlines present)
 * - Parenthetical descriptions followed by quantities (e.g., "...description) 1 cup...")
 */
export function parseIngredients(input: string): string[] {
  if (!input || typeof input !== 'string') {
    return [];
  }

  // Normalize line endings
  const text = input.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Check if input has multiple lines
  const hasNewlines = text.includes('\n');

  let ingredients: string[];

  if (hasNewlines) {
    // Split by newlines first
    ingredients = text.split('\n');
  } else {
    // Check for pattern: ingredients with parenthetical descriptions followed by quantities
    // e.g., "1 cup berries (for flavor) 2 tbsp honey (for sweetness) 1 banana"
    // Pattern: ") " followed by a quantity (number or fraction)
    const parentheticalPattern = /\)\s+(?=[\d½¼¾⅓⅔⅛]+[\s–-])/g;
    const hasParentheticalSeparators = parentheticalPattern.test(text);

    if (hasParentheticalSeparators) {
      // Split on ") " followed by a quantity, keeping the ) with the previous ingredient
      ingredients = text.split(/\)\s+(?=[\d½¼¾⅓⅔⅛]+[\s–-])/).map((ing, idx, arr) => {
        // Add back the ) to all but the last segment (which doesn't need it)
        return idx < arr.length - 1 ? ing + ')' : ing;
      });
    } else {
      // If no newlines, try comma separation (but only for clearly comma-separated lists)
      // Don't split if commas appear to be part of ingredient descriptions
      // e.g., "1 cup milk, cold" should not be split
      const commaCount = (text.match(/,/g) || []).length;

      // Only treat as comma-separated list if:
      // 1. Has 2+ commas (clearly a list), OR
      // 2. Has 1 comma AND both parts look like complete ingredients (have quantities/measurements)
      let seemsLikeList = false;

      if (commaCount >= 2) {
        seemsLikeList = true;
      } else if (commaCount === 1) {
        const parts = text.split(',').map(p => p.trim());
        // Check if both parts look like ingredients (start with a number or have measurement words)
        const measurementPattern = /^[\d½¼¾⅓⅔⅛]+|cup|tbsp|tsp|oz|lb|gram|ml|liter|bunch|clove|piece|slice|can|bottle|package/i;
        const bothLookLikeIngredients = parts.every(part => measurementPattern.test(part));
        seemsLikeList = bothLookLikeIngredients;
      }

      if (seemsLikeList) {
        ingredients = text.split(',');
      } else {
        ingredients = [text];
      }
    }
  }

  // Clean up each ingredient
  ingredients = ingredients.map(ingredient => {
    let cleaned = ingredient.trim();

    // Remove common list prefixes
    // Bullet points: •, -, *, ·, ▪, ▸, ►, ➤, ○, ●
    cleaned = cleaned.replace(/^[•\-*·▪▸►➤○●]\s*/, '');

    // Numbered lists: 1., 2., 1), 2), 1:, 2:, (1), (2)
    cleaned = cleaned.replace(/^\d+[.):\]]\s*/, '');
    cleaned = cleaned.replace(/^\(\d+\)\s*/, '');

    // Checkbox style: [ ], [x], ☐, ☑, ✓, ✔
    cleaned = cleaned.replace(/^\[[ x]?\]\s*/i, '');
    cleaned = cleaned.replace(/^[☐☑✓✔]\s*/, '');

    return cleaned.trim();
  });

  // Filter out empty strings
  ingredients = ingredients.filter(ing => ing.length > 0);

  return ingredients;
}

/**
 * Checks if the input looks like a multi-ingredient paste
 * (contains multiple ingredients that should be split)
 */
export function isMultiIngredientPaste(input: string): boolean {
  const parsed = parseIngredients(input);
  return parsed.length > 1;
}
