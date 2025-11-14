import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { updateCommunityRecipe } from './community';

/**
 * Integration test to reproduce the 404 error when updating a recipe
 * This test simulates the actual URL being called: PUT /functions/v1/recipes/{encodedRecipeId}
 */
describe('updateCommunityRecipe - Integration Test (Reproducing 404)', () => {
  const originalFetch = global.fetch;
  const mockRecipeId = 'recipe:1762405222159:19kx5';
  const mockRecipe = {
    name: 'Test Smoothie',
    contributor: 'test@example.com',
    emoji: '🥤',
    color: '#9333EA',
    ingredients: ['1 banana'],
    instructions: 'Blend',
    servings: 1,
    prepTime: '5 min',
    containsFat: false,
    containsNuts: false,
  };

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    global.fetch = originalFetch;
  });

  it('should reproduce the exact URL pattern that causes 404', async () => {
    // Simulate the exact URL from the error:
    // PUT https://vbzmelpvugyixagfiftu.supabase.co/functions/v1/recipes/recipe%3A1762405222159%3A19kx5
    
    // Mock a 404 response to reproduce the error
    const mock404Response = {
      ok: false,
      status: 404,
      text: async () => '404 Not Found',
    };

    vi.mocked(global.fetch).mockResolvedValue(mock404Response as Response);

    // Temporarily override baseUrl to match the actual URL
    // This simulates what happens in production
    const originalEnv = import.meta.env;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (import.meta as any).env = {
      ...originalEnv,
      VITE_SUPABASE_URL: 'https://vbzmelpvugyixagfiftu.supabase.co',
    };

    try {
      await expect(updateCommunityRecipe(mockRecipeId, mockRecipe)).rejects.toThrow('Failed to update recipe: 404');
      
      // Verify the exact URL was called
      expect(global.fetch).toHaveBeenCalledTimes(1);
      const callArgs = vi.mocked(global.fetch).mock.calls[0];
      const actualUrl = callArgs[0] as string;
      
      // The URL should match the pattern from the error
      expect(actualUrl).toContain('/functions/v1/recipes/');
      expect(actualUrl).toContain('recipe%3A1762405222159%3A19kx5');
    } finally {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (import.meta as any).env = originalEnv;
    }
  });

  it('should verify route pattern matches GET/POST pattern', async () => {
    // GET and POST use: fetch(baseUrl) where baseUrl = '/functions/v1/recipes'
    // They match routes: app.get('/recipes') and app.post('/recipes')
    // 
    // PUT uses: fetch(`${baseUrl}/${encodedRecipeId}`) = '/functions/v1/recipes/{id}'
    // This should match: app.put('/:id') after Supabase strips the function name
    
    const mockResponse = {
      ok: true,
      json: async () => ({
        success: true,
        recipe: {
          id: mockRecipeId,
          ...mockRecipe,
          createdAt: '2024-01-01',
        },
      }),
    };

    vi.mocked(global.fetch).mockResolvedValue(mockResponse as Response);

    await updateCommunityRecipe(mockRecipeId, mockRecipe);

    const callArgs = vi.mocked(global.fetch).mock.calls[0];
    const url = callArgs[0] as string;
    
    // The URL should be: /functions/v1/recipes/{encodedRecipeId}
    // Pattern matches the error URL exactly
    expect(url).toMatch(/\/functions\/v1\/recipes\/recipe%3A1762405222159%3A19kx5$/);
  });
});

