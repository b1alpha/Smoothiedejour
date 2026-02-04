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
    const lines = text.split('\n');

    // Process each line - some lines might contain multiple ingredients
    ingredients = [];
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // Check if this line contains multiple parenthetical ingredients
      const parentheticalPattern = /\)\s+(?=[\d½¼¾⅓⅔⅛]+[\s–-])/g;
      if (parentheticalPattern.test(trimmedLine)) {
        // Split this line into multiple ingredients
        const subIngredients = trimmedLine.split(/\)\s+(?=[\d½¼¾⅓⅔⅛]+[\s–-])/).map((ing, idx, arr) => {
          return idx < arr.length - 1 ? ing + ')' : ing;
        });
        ingredients.push(...subIngredients);
      } else {
        ingredients.push(trimmedLine);
      }
    }
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
      // e.g., "1 cup milk, cold" or "1 cup milk, cold, organic" should NOT be split

      // Split by commas, but treat this as a list only if most segments look like
      // complete ingredients (have their own quantity/measurement at the start)
      const parts = text.split(',').map(p => p.trim()).filter(p => p.length > 0);

      if (parts.length >= 2) {
        // Pattern to detect if a segment starts with a quantity (number, fraction, or measurement word)
        // This indicates it's a complete ingredient, not a modifier like "cold" or "organic"
        const startsWithQuantityPattern = /^[\d½¼¾⅓⅔⅛]+\s|^(a|an|one|two|three|four|five|some|few|several|handful|pinch|dash|splash)\s/i;

        // Count how many segments look like complete ingredients (start with quantity)
        const segmentsWithQuantity = parts.filter(part => startsWithQuantityPattern.test(part)).length;

        // Only treat as a comma-separated list if:
        // - At least 2 segments have quantities, AND
        // - Most segments (> 50%) have quantities (to avoid "1 cup milk, cold, 2 tbsp honey" splitting wrong)
        const seemsLikeList = segmentsWithQuantity >= 2 && segmentsWithQuantity >= parts.length / 2;
        
        if (seemsLikeList) {
          ingredients = parts;
        } else {
          ingredients = [text];
        }
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

  // Filter out empty strings and common header words
  const headerPatterns = /^(ingredients?|instructions?|directions?|steps?|method|recipe|serves?|yield|prep|cook|total|time|notes?):?\s*$/i;
  ingredients = ingredients.filter(ing => ing.length > 0 && !headerPatterns.test(ing));

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
