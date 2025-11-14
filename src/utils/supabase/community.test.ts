import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { updateCommunityRecipe } from './community';

describe('updateCommunityRecipe', () => {
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

  it('should encode recipe ID with colons correctly in URL', async () => {
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

    // Verify the fetch was called with correct URL
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const callArgs = vi.mocked(global.fetch).mock.calls[0];
    const url = callArgs[0] as string;
    const method = callArgs[1]?.method;

    expect(method).toBe('PUT');
    // The URL should contain the encoded recipe ID
    expect(url).toContain('recipe%3A1762405222159%3A19kx5');
    // But should NOT contain double encoding
    expect(url).not.toContain('recipe%253A');
    // The URL should end with the encoded ID (baseUrl already includes /functions/v1/recipes)
    expect(url).toMatch(/\/recipe%3A1762405222159%3A19kx5$/);
  });

  it('should handle 404 error when recipe not found', async () => {
    const mockResponse = {
      ok: false,
      status: 404,
      text: async () => '404 Not Found',
    };

    vi.mocked(global.fetch).mockResolvedValue(mockResponse as Response);

    await expect(updateCommunityRecipe(mockRecipeId, mockRecipe)).rejects.toThrow(
      'Failed to update recipe: 404'
    );
  });

  it('should send recipe data in request body', async () => {
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
    const body = callArgs[1]?.body;

    expect(body).toBe(JSON.stringify(mockRecipe));
  });

  it('should return updated recipe on success', async () => {
    const mockUpdatedRecipe = {
      id: mockRecipeId,
      ...mockRecipe,
      name: 'Updated Smoothie',
      createdAt: '2024-01-01',
    };

    const mockResponse = {
      ok: true,
      json: async () => ({
        success: true,
        recipe: mockUpdatedRecipe,
      }),
    };

    vi.mocked(global.fetch).mockResolvedValue(mockResponse as Response);

    const result = await updateCommunityRecipe(mockRecipeId, { ...mockRecipe, name: 'Updated Smoothie' });

    expect(result).toEqual(mockUpdatedRecipe);
    expect(result.name).toBe('Updated Smoothie');
  });

  it('should handle network errors', async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));

    await expect(updateCommunityRecipe(mockRecipeId, mockRecipe)).rejects.toThrow('Network error');
  });

  it('should construct correct URL pattern for recipe updates', async () => {
    // This test verifies the URL construction pattern is correct
    // Note: The URL and project ID values are public by design (VITE_ prefix means client-side)
    // They're safe to expose as they're already visible in browser network requests
    
    const mockResponse = {
      ok: false,
      status: 404,
      text: async () => '404 Not Found',
    };

    vi.mocked(global.fetch).mockResolvedValue(mockResponse as Response);

    await expect(updateCommunityRecipe(mockRecipeId, mockRecipe)).rejects.toThrow(
      'Failed to update recipe: 404'
    );

    // Verify the URL pattern matches expected structure
    const callArgs = vi.mocked(global.fetch).mock.calls[0];
    const url = callArgs[0] as string;
    
    // Verify URL structure: should contain /functions/v1/recipes/ and encoded recipe ID
    expect(url).toMatch(/https:\/\/.*\.supabase\.co\/functions\/v1\/recipes\/recipe%3A1762405222159%3A19kx5$/);
    expect(url).toContain('/functions/v1/recipes/');
    expect(url).toContain('recipe%3A1762405222159%3A19kx5');
    // Should NOT contain double encoding
    expect(url).not.toContain('recipe%253A');
  });
});

