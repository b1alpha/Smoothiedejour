import { z } from 'zod';

export const recipeSchema = z.object({
  name: z
    .string()
    .min(1, 'Recipe name is required')
    .max(100, 'Recipe name must be 100 characters or less')
    .trim(),
  
  contributor: z
    .string()
    .min(1, 'Contributor name is required')
    .max(50, 'Contributor name must be 50 characters or less')
    .trim(),
  
  emoji: z
    .string()
    .min(1, 'Please select an emoji'),
  
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Please select a valid color'),
  
  ingredients: z
    .array(z.string().trim().min(1, 'Ingredient cannot be empty'))
    .min(1, 'At least one ingredient is required')
    .refine(
      (ingredients) => ingredients.every(ing => ing.trim().length > 0),
      { message: 'All ingredients must have content' }
    ),
  
  instructions: z
    .string()
    .min(1, 'Instructions are required')
    .refine((val) => val.trim().length >= 10, {
      message: 'Instructions must be at least 10 characters',
    })
    .max(2000, 'Instructions must be 2000 characters or less')
    .trim(),
  
  servings: z
    .string()
    .refine(
      (val) => {
        const num = parseInt(val, 10);
        return !isNaN(num) && num >= 1 && num <= 100;
      },
      { message: 'Servings must be a number between 1 and 100' }
    ),
  
  prepTime: z
    .string()
    .min(1, 'Prep time is required')
    .max(50, 'Prep time must be 50 characters or less')
    .trim(),
  
  containsFat: z.boolean(),
  containsNuts: z.boolean(),
});

export type RecipeFormData = z.infer<typeof recipeSchema>;

