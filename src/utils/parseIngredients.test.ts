import { describe, it, expect } from 'vitest';
import { parseIngredients, isMultiIngredientPaste } from './parseIngredients';

describe('parseIngredients', () => {
  describe('newline-separated ingredients', () => {
    it('should split ingredients by newlines', () => {
      const input = `1 banana
1 cup milk
2 tbsp honey`;
      expect(parseIngredients(input)).toEqual([
        '1 banana',
        '1 cup milk',
        '2 tbsp honey',
      ]);
    });

    it('should handle Windows-style line endings (CRLF)', () => {
      const input = '1 banana\r\n1 cup milk\r\n2 tbsp honey';
      expect(parseIngredients(input)).toEqual([
        '1 banana',
        '1 cup milk',
        '2 tbsp honey',
      ]);
    });

    it('should handle old Mac-style line endings (CR)', () => {
      const input = '1 banana\r1 cup milk\r2 tbsp honey';
      expect(parseIngredients(input)).toEqual([
        '1 banana',
        '1 cup milk',
        '2 tbsp honey',
      ]);
    });

    it('should filter out empty lines', () => {
      const input = `1 banana

1 cup milk

2 tbsp honey`;
      expect(parseIngredients(input)).toEqual([
        '1 banana',
        '1 cup milk',
        '2 tbsp honey',
      ]);
    });
  });

  describe('bullet point lists', () => {
    it('should remove dash bullet points', () => {
      const input = `- 1 banana
- 1 cup milk
- 2 tbsp honey`;
      expect(parseIngredients(input)).toEqual([
        '1 banana',
        '1 cup milk',
        '2 tbsp honey',
      ]);
    });

    it('should remove asterisk bullet points', () => {
      const input = `* 1 banana
* 1 cup milk
* 2 tbsp honey`;
      expect(parseIngredients(input)).toEqual([
        '1 banana',
        '1 cup milk',
        '2 tbsp honey',
      ]);
    });

    it('should remove unicode bullet points', () => {
      const input = `• 1 banana
• 1 cup milk
• 2 tbsp honey`;
      expect(parseIngredients(input)).toEqual([
        '1 banana',
        '1 cup milk',
        '2 tbsp honey',
      ]);
    });

    it('should remove middle dot bullet points', () => {
      const input = `· 1 banana
· 1 cup milk`;
      expect(parseIngredients(input)).toEqual([
        '1 banana',
        '1 cup milk',
      ]);
    });
  });

  describe('numbered lists', () => {
    it('should remove period-style numbered lists', () => {
      const input = `1. 1 banana
2. 1 cup milk
3. 2 tbsp honey`;
      expect(parseIngredients(input)).toEqual([
        '1 banana',
        '1 cup milk',
        '2 tbsp honey',
      ]);
    });

    it('should remove parenthesis-style numbered lists', () => {
      const input = `1) 1 banana
2) 1 cup milk
3) 2 tbsp honey`;
      expect(parseIngredients(input)).toEqual([
        '1 banana',
        '1 cup milk',
        '2 tbsp honey',
      ]);
    });

    it('should remove colon-style numbered lists', () => {
      const input = `1: 1 banana
2: 1 cup milk`;
      expect(parseIngredients(input)).toEqual([
        '1 banana',
        '1 cup milk',
      ]);
    });

    it('should remove parenthesized numbers', () => {
      const input = `(1) 1 banana
(2) 1 cup milk`;
      expect(parseIngredients(input)).toEqual([
        '1 banana',
        '1 cup milk',
      ]);
    });
  });

  describe('checkbox lists', () => {
    it('should remove unchecked checkboxes', () => {
      const input = `[ ] 1 banana
[ ] 1 cup milk`;
      expect(parseIngredients(input)).toEqual([
        '1 banana',
        '1 cup milk',
      ]);
    });

    it('should remove checked checkboxes', () => {
      const input = `[x] 1 banana
[X] 1 cup milk`;
      expect(parseIngredients(input)).toEqual([
        '1 banana',
        '1 cup milk',
      ]);
    });

    it('should remove unicode checkboxes', () => {
      const input = `☐ 1 banana
☑ 1 cup milk
✓ 2 tbsp honey
✔ 1 cup ice`;
      expect(parseIngredients(input)).toEqual([
        '1 banana',
        '1 cup milk',
        '2 tbsp honey',
        '1 cup ice',
      ]);
    });
  });

  describe('comma-separated ingredients', () => {
    it('should split by commas when no newlines present', () => {
      const input = '1 banana, 1 cup milk, 2 tbsp honey';
      expect(parseIngredients(input)).toEqual([
        '1 banana',
        '1 cup milk',
        '2 tbsp honey',
      ]);
    });

    it('should not split single ingredient with comma in description', () => {
      // "1 cup milk, cold" should stay as one ingredient
      const input = '1 cup milk, cold';
      expect(parseIngredients(input)).toEqual(['1 cup milk, cold']);
    });

    it('should prefer newlines over commas when both present', () => {
      const input = `1 banana, ripe
1 cup milk, cold`;
      expect(parseIngredients(input)).toEqual([
        '1 banana, ripe',
        '1 cup milk, cold',
      ]);
    });
  });

  describe('parenthetical descriptions followed by quantities', () => {
    it('should split ingredients with parenthetical descriptions pasted as one line', () => {
      const input = '1 cup frozen blueberries (or mixed berries – loaded with anthocyanin antioxidants that support memory and protect brain cells) ½ ripe avocado (provides healthy monounsaturated fats that improve blood flow to the brain and reduce inflammation) 1 small ripe banana (adds natural sweetness, potassium, vitamin B6, and dopamine-supporting compounds for attention and mood) 1–2 handfuls fresh spinach or kale (rich in folate, vitamin K, lutein, and antioxidants linked to slower cognitive decline) 1 tablespoon chia seeds or ground flaxseeds (great source of plant-based omega-3s for brain cell health and anti-inflammatory effects) 1 tablespoon almond butter or walnuts (healthy fats + a bit of protein for sustained energy and neurotransmitter support) 1 cup unsweetened almond milk, oat milk, or coconut water (for blending; coconut water adds natural electrolytes)';

      const result = parseIngredients(input);

      expect(result).toHaveLength(7);
      expect(result[0]).toBe('1 cup frozen blueberries (or mixed berries – loaded with anthocyanin antioxidants that support memory and protect brain cells)');
      expect(result[1]).toBe('½ ripe avocado (provides healthy monounsaturated fats that improve blood flow to the brain and reduce inflammation)');
      expect(result[2]).toBe('1 small ripe banana (adds natural sweetness, potassium, vitamin B6, and dopamine-supporting compounds for attention and mood)');
      expect(result[3]).toBe('1–2 handfuls fresh spinach or kale (rich in folate, vitamin K, lutein, and antioxidants linked to slower cognitive decline)');
      expect(result[4]).toBe('1 tablespoon chia seeds or ground flaxseeds (great source of plant-based omega-3s for brain cell health and anti-inflammatory effects)');
      expect(result[5]).toBe('1 tablespoon almond butter or walnuts (healthy fats + a bit of protein for sustained energy and neurotransmitter support)');
      expect(result[6]).toBe('1 cup unsweetened almond milk, oat milk, or coconut water (for blending; coconut water adds natural electrolytes)');
    });

    it('should handle simple parenthetical ingredients', () => {
      const input = '1 banana (ripe) 2 cups milk (cold)';
      const result = parseIngredients(input);

      expect(result).toHaveLength(2);
      expect(result[0]).toBe('1 banana (ripe)');
      expect(result[1]).toBe('2 cups milk (cold)');
    });

    it('should not split when there is only one ingredient with parentheses', () => {
      const input = '1 cup milk (preferably whole)';
      const result = parseIngredients(input);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe('1 cup milk (preferably whole)');
    });
  });

  describe('edge cases', () => {
    it('should return empty array for empty string', () => {
      expect(parseIngredients('')).toEqual([]);
    });

    it('should return empty array for null/undefined', () => {
      expect(parseIngredients(null as unknown as string)).toEqual([]);
      expect(parseIngredients(undefined as unknown as string)).toEqual([]);
    });

    it('should return single ingredient for simple input', () => {
      expect(parseIngredients('1 banana')).toEqual(['1 banana']);
    });

    it('should trim whitespace from ingredients', () => {
      const input = '  1 banana  \n  1 cup milk  ';
      expect(parseIngredients(input)).toEqual([
        '1 banana',
        '1 cup milk',
      ]);
    });

    it('should handle mixed formatting', () => {
      const input = `1. 1 banana
- 1 cup milk
• 2 tbsp honey
3) 1 cup ice`;
      expect(parseIngredients(input)).toEqual([
        '1 banana',
        '1 cup milk',
        '2 tbsp honey',
        '1 cup ice',
      ]);
    });
  });
});

describe('isMultiIngredientPaste', () => {
  it('should return true for multi-line input', () => {
    expect(isMultiIngredientPaste('1 banana\n1 cup milk')).toBe(true);
  });

  it('should return true for comma-separated list', () => {
    expect(isMultiIngredientPaste('1 banana, 1 cup milk, honey')).toBe(true);
  });

  it('should return false for single ingredient', () => {
    expect(isMultiIngredientPaste('1 banana')).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(isMultiIngredientPaste('')).toBe(false);
  });

  it('should return false for ingredient with descriptive comma', () => {
    expect(isMultiIngredientPaste('1 cup milk, cold')).toBe(false);
  });
});
