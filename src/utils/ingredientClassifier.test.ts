import { describe, it, expect } from 'vitest';
import {
  normalize,
  containsKeyword,
  matchesKeywords,
  classifyIngredients,
  config,
} from './ingredientClassifier';

describe('ingredientClassifier', () => {
  describe('normalize', () => {
    it('should lowercase text', () => {
      expect(normalize('PEANUT BUTTER')).toBe('peanut butter');
    });

    it('should remove punctuation except hyphens', () => {
      expect(normalize('1/2 cup (optional)')).toBe('1 2 cup optional');
    });

    it('should preserve hyphens', () => {
      expect(normalize('fat-free milk')).toBe('fat-free milk');
    });

    it('should collapse whitespace', () => {
      expect(normalize('peanut   butter')).toBe('peanut butter');
    });

    it('should trim whitespace', () => {
      expect(normalize('  peanut butter  ')).toBe('peanut butter');
    });

    it('should handle mixed cases', () => {
      expect(normalize('½ Cup Greek Yogurt!')).toBe('cup greek yogurt');
    });
  });

  describe('containsKeyword', () => {
    it('should match exact keywords', () => {
      expect(containsKeyword('1 cup peanut butter', 'peanut butter')).toBe(true);
    });

    it('should match single word keywords', () => {
      expect(containsKeyword('1 avocado', 'avocado')).toBe(true);
    });

    it('should not match partial words', () => {
      // "butternut" should not match "nut"
      expect(containsKeyword('1 cup butternut squash', 'nut')).toBe(false);
    });

    it('should not match "nut" in "nutmeg"', () => {
      expect(containsKeyword('1 tsp nutmeg', 'nut')).toBe(false);
    });

    it('should not match "nut" in "coconut"', () => {
      expect(containsKeyword('1 cup coconut milk', 'nut')).toBe(false);
    });

    it('should match word at start of string', () => {
      expect(containsKeyword('almonds chopped', 'almonds')).toBe(true);
    });

    it('should match word at end of string', () => {
      expect(containsKeyword('chopped almonds', 'almonds')).toBe(true);
    });

    it('should handle hyphenated keywords flexibly', () => {
      // "fat-free" should match both "fat-free" and "fat free"
      expect(containsKeyword('fat-free milk', 'fat-free')).toBe(true);
      expect(containsKeyword('fat free milk', 'fat-free')).toBe(true);
    });

    it('should be case insensitive', () => {
      expect(containsKeyword('PEANUT BUTTER', 'peanut')).toBe(true);
    });
  });

  describe('matchesKeywords', () => {
    const testKeywords = {
      include: ['peanut', 'almond', 'walnut'],
      exclude: ['coconut', 'butternut'],
    };

    it('should return matches=true when include keyword found', () => {
      const result = matchesKeywords(['1 cup peanut butter'], testKeywords);
      expect(result.matches).toBe(true);
      expect(result.matchedIncludes).toHaveLength(1);
    });

    it('should return matches=false when no include keywords found', () => {
      const result = matchesKeywords(['1 banana', '1 cup milk'], testKeywords);
      expect(result.matches).toBe(false);
      expect(result.matchedIncludes).toHaveLength(0);
    });

    it('should exclude ingredient matching exclude keyword', () => {
      // Coconut yogurt should not trigger nut detection
      const result = matchesKeywords(['1 cup coconut yogurt'], testKeywords);
      expect(result.matches).toBe(false);
      expect(result.matchedExcludes).toHaveLength(1);
    });

    it('should apply excludes per-ingredient, not globally', () => {
      // Coconut should be excluded, but peanut butter should still match
      const result = matchesKeywords(
        ['1 cup coconut yogurt', '2 tbsp peanut butter'],
        testKeywords
      );
      expect(result.matches).toBe(true);
      expect(result.matchedIncludes).toHaveLength(1);
      expect(result.matchedExcludes).toHaveLength(1);
    });

    it('should exclude butternut squash from nut detection', () => {
      const result = matchesKeywords(['1 cup butternut squash'], testKeywords);
      expect(result.matches).toBe(false);
    });

    it('should handle multiple ingredients with matches', () => {
      const result = matchesKeywords(
        ['1 cup almond milk', '2 tbsp walnut pieces'],
        testKeywords
      );
      expect(result.matches).toBe(true);
      expect(result.matchedIncludes).toHaveLength(2);
    });

    it('should only count one match per ingredient', () => {
      // "almond butter" contains both "almond" - should only count once
      const result = matchesKeywords(['almond butter'], testKeywords);
      expect(result.matchedIncludes).toHaveLength(1);
    });
  });

  describe('classifyIngredients', () => {
    describe('nut detection', () => {
      it('should detect peanut butter as containing nuts', () => {
        const result = classifyIngredients(['1 cup peanut butter']);
        expect(result.containsNuts).toBe(true);
      });

      it('should detect almond milk as containing nuts', () => {
        const result = classifyIngredients(['1 cup almond milk']);
        expect(result.containsNuts).toBe(true);
      });

      it('should detect walnuts as containing nuts', () => {
        const result = classifyIngredients(['1/4 cup walnuts']);
        expect(result.containsNuts).toBe(true);
      });

      it('should NOT detect coconut as nuts', () => {
        const result = classifyIngredients(['1 cup coconut milk']);
        expect(result.containsNuts).toBe(false);
      });

      it('should NOT detect nutmeg as nuts', () => {
        const result = classifyIngredients(['1 tsp nutmeg']);
        expect(result.containsNuts).toBe(false);
      });

      it('should NOT detect butternut squash as nuts', () => {
        const result = classifyIngredients(['1 cup butternut squash']);
        expect(result.containsNuts).toBe(false);
      });

      it('should detect nuts even when coconut is also present', () => {
        const result = classifyIngredients([
          '1 cup coconut yogurt',
          '2 tbsp peanut butter',
        ]);
        expect(result.containsNuts).toBe(true);
      });

      it('should detect Nutella as containing nuts', () => {
        const result = classifyIngredients(['1 tbsp Nutella']);
        expect(result.containsNuts).toBe(true);
      });

      it('should detect cashew butter as containing nuts', () => {
        const result = classifyIngredients(['1 tbsp cashew butter']);
        expect(result.containsNuts).toBe(true);
      });
    });

    describe('fat detection', () => {
      it('should detect avocado as containing fat', () => {
        const result = classifyIngredients(['1 avocado']);
        expect(result.containsFat).toBe(true);
      });

      it('should detect Greek yogurt as containing fat', () => {
        const result = classifyIngredients(['1 cup Greek yogurt']);
        expect(result.containsFat).toBe(true);
      });

      it('should detect chia seeds as containing fat', () => {
        const result = classifyIngredients(['1 tbsp chia seeds']);
        expect(result.containsFat).toBe(true);
      });

      it('should detect coconut milk as containing fat', () => {
        const result = classifyIngredients(['1 cup coconut milk']);
        expect(result.containsFat).toBe(true);
      });

      it('should detect peanut butter as containing fat', () => {
        const result = classifyIngredients(['2 tbsp peanut butter']);
        expect(result.containsFat).toBe(true);
      });

      it('should NOT detect nonfat yogurt as containing fat', () => {
        const result = classifyIngredients(['1 cup nonfat yogurt']);
        expect(result.containsFat).toBe(false);
      });

      it('should NOT detect skim milk as containing fat', () => {
        const result = classifyIngredients(['1 cup skim milk']);
        expect(result.containsFat).toBe(false);
      });

      it('should NOT detect fat-free milk as containing fat', () => {
        const result = classifyIngredients(['1 cup fat-free milk']);
        expect(result.containsFat).toBe(false);
      });

      it('should NOT detect 0% yogurt as containing fat', () => {
        const result = classifyIngredients(['1 cup Greek yogurt (0% fat)']);
        expect(result.containsFat).toBe(false);
      });

      it('should detect fat when non-fat and fat items are both present', () => {
        const result = classifyIngredients([
          '1 cup nonfat yogurt',
          '1 tbsp chia seeds',
        ]);
        expect(result.containsFat).toBe(true);
      });

      it('should NOT detect coconut water as containing fat', () => {
        const result = classifyIngredients(['1 cup coconut water']);
        expect(result.containsFat).toBe(false);
      });

      it('should detect hemp hearts as containing fat', () => {
        const result = classifyIngredients(['2 tbsp hemp hearts']);
        expect(result.containsFat).toBe(true);
      });

      it('should detect flaxseed as containing fat', () => {
        const result = classifyIngredients(['1 tbsp ground flaxseed']);
        expect(result.containsFat).toBe(true);
      });
    });

    describe('combined classification', () => {
      it('should detect both nuts and fat in peanut butter', () => {
        const result = classifyIngredients(['2 tbsp peanut butter']);
        expect(result.containsNuts).toBe(true);
        expect(result.containsFat).toBe(true);
      });

      it('should detect fat but not nuts in coconut milk', () => {
        const result = classifyIngredients(['1 cup coconut milk']);
        expect(result.containsNuts).toBe(false);
        expect(result.containsFat).toBe(true);
      });

      it('should detect neither in a simple fruit smoothie', () => {
        const result = classifyIngredients([
          '1 banana',
          '1 cup strawberries',
          '1 cup water',
          '1 tbsp honey',
        ]);
        expect(result.containsNuts).toBe(false);
        expect(result.containsFat).toBe(false);
      });

      it('should handle complex real-world recipe', () => {
        const result = classifyIngredients([
          '1 cup frozen Italian plums',
          '1 banana (fresh or frozen)',
          '½ cup plain Greek yogurt',
          '¾ cup milk (dairy or plant-based)',
          '1 tablespoon honey or maple syrup',
          '¼ teaspoon vanilla extract',
          '¼ teaspoon cinnamon',
          'Small pinch of cardamom (optional)',
          'Handful of ice if your plums aren\'t frozen solid',
        ]);
        expect(result.containsNuts).toBe(false);
        expect(result.containsFat).toBe(true); // Greek yogurt
      });

      it('should handle recipe with almond butter', () => {
        const result = classifyIngredients([
          '1 cup almond milk',
          '1 tbsp almond butter',
          '1 banana',
          '1 cup spinach',
        ]);
        expect(result.containsNuts).toBe(true);
        expect(result.containsFat).toBe(true);
      });
    });

    describe('edge cases', () => {
      it('should handle empty ingredients array', () => {
        const result = classifyIngredients([]);
        expect(result.containsNuts).toBe(false);
        expect(result.containsFat).toBe(false);
      });

      it('should handle ingredients with special characters', () => {
        const result = classifyIngredients(['½ cup "peanut butter" (smooth)']);
        expect(result.containsNuts).toBe(true);
      });

      it('should handle ingredient with optional mention', () => {
        // "optional almond butter" should still match
        const result = classifyIngredients(['1 tbsp almond butter (optional)']);
        expect(result.containsNuts).toBe(true);
      });

      it('should provide details about matches', () => {
        const result = classifyIngredients([
          '1 cup coconut yogurt',
          '2 tbsp peanut butter',
        ]);
        expect(result.nutDetails.matchedIncludes.length).toBeGreaterThan(0);
        expect(result.nutDetails.matchedExcludes.length).toBeGreaterThan(0);
      });
    });
  });

  describe('config', () => {
    it('should have a version string', () => {
      expect(config.version).toBeDefined();
      expect(typeof config.version).toBe('string');
    });

    it('should have nuts keywords', () => {
      expect(config.nuts.include.length).toBeGreaterThan(0);
      expect(config.nuts.exclude.length).toBeGreaterThan(0);
    });

    it('should have fat keywords', () => {
      expect(config.fat.include.length).toBeGreaterThan(0);
      expect(config.fat.exclude.length).toBeGreaterThan(0);
    });

    it('should include common nut terms', () => {
      expect(config.nuts.include).toContain('peanut');
      expect(config.nuts.include).toContain('almond');
      expect(config.nuts.include).toContain('walnut');
    });

    it('should exclude coconut from nuts', () => {
      expect(config.nuts.exclude).toContain('coconut');
    });

    it('should include common fat terms', () => {
      expect(config.fat.include).toContain('avocado');
      expect(config.fat.include).toContain('yogurt');
      expect(config.fat.include).toContain('chia');
    });

    it('should exclude nonfat terms from fat', () => {
      expect(config.fat.exclude).toContain('nonfat');
      expect(config.fat.exclude).toContain('skim milk');
    });
  });
});
