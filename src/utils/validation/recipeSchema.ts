import { z } from 'zod';

// Helper to create a trimmed string with min/max validation
// Trims BEFORE validation so whitespace-only strings are rejected
const trimmedString = (minLength: number, maxLength: number, minMessage: string, maxMessage: string) =>
  z.string()
    .transform((val) => val.trim())
    .pipe(
      z.string()
        .min(minLength, minMessage)
        .max(maxLength, maxMessage)
    );

export const recipeSchema = z.object({
  name: trimmedString(1, 100, 'Recipe name is required', 'Recipe name must be 100 characters or less'),
  
  contributor: trimmedString(1, 50, 'Contributor name is required', 'Contributor name must be 50 characters or less'),
  
  emoji: z
    .string()
    .min(1, 'Please select an emoji'),
  
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Please select a valid color'),
  
  ingredients: z
    .array(z.string().trim())
    .refine(
      (ingredients) => {
        // Filter out empty/whitespace-only ingredients and check if at least one remains
        const nonEmptyIngredients = ingredients.filter(ing => ing.trim().length > 0);
        return nonEmptyIngredients.length > 0;
      },
      { message: 'At least one ingredient is required' }
    ),
  
  instructions: z
    .string()
    .transform((val) => val.trim())
    .pipe(
      z.string()
        .min(10, 'Instructions must be at least 10 characters')
        .max(2000, 'Instructions must be 2000 characters or less')
    ),
  
  servings: z
    .string()
    .refine(
      (val) => {
        const num = parseInt(val, 10);
        return !isNaN(num) && num >= 1 && num <= 100;
      },
      { message: 'Servings must be a number between 1 and 100' }
    ),
  
  prepTime: trimmedString(1, 50, 'Prep time is required', 'Prep time must be 50 characters or less'),
  
  containsFat: z.boolean(),
  containsNuts: z.boolean(),
});

export type RecipeFormData = z.infer<typeof recipeSchema>;

