import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import * as communityUtils from './utils/supabase/community';
import { smoothieRecipes } from './data/recipes';

// Mock the community utils
vi.mock('./utils/supabase/community', () => ({
  fetchCommunityRecipes: vi.fn(),
  submitCommunityRecipe: vi.fn(),
  updateCommunityRecipe: vi.fn(),
}));

// Mock Supabase client
vi.mock('./utils/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user', email: 'test@example.com', user_metadata: {} } },
        error: null,
      }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user', email: 'test@example.com', user_metadata: {} }, session: {} },
        error: null,
      }),
      signUp: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user', email: 'test@example.com', user_metadata: {} }, session: {} },
        error: null,
      }),
      updateUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user', email: 'test@example.com', user_metadata: { nickname: 'TestUser' } } },
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}));

// Helper to render App with AuthProvider
const renderApp = () => {
  let result: ReturnType<typeof render>;
  act(() => {
    result = render(
      <AuthProvider>
        <App />
      </AuthProvider>
    );
  });
  return result!;
};

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // Mock fetchCommunityRecipes to fail by default (so defaults are shown)
    vi.mocked(communityUtils.fetchCommunityRecipes).mockRejectedValue(new Error('Network error'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render the app with header', async () => {
    renderApp();

    await waitFor(() => {
      expect(screen.getByText('Smoothie de Jour')).toBeInTheDocument();
    });
  });

  it('should display recipe count in header', async () => {
    renderApp();

    await waitFor(() => {
      const headerText = screen.getByText(/Community recipes, served fresh/i);
      expect(headerText).toBeInTheDocument();
      expect(headerText.textContent).toContain(`${smoothieRecipes.length} recipes`);
    });
  });

  it('should show shake instruction when no recipe is selected', async () => {
    renderApp();

    await waitFor(() => {
      expect(screen.getByText(/shake your phone/i)).toBeInTheDocument();
    });
  });

  it('should display a random recipe when "Get Another Recipe" is clicked', async () => {
    const user = userEvent.setup();
    renderApp();

    const getRecipeButton = await screen.findByRole('button', { name: /get another recipe/i });
    await user.click(getRecipeButton);

    await waitFor(() => {
      // Should show a recipe card
      expect(screen.queryByText(/shake your device/i)).not.toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('should toggle favorite when favorite button is clicked', async () => {
    const user = userEvent.setup();
    renderApp();

    // First get a recipe
    const getRecipeButton = await screen.findByRole('button', { name: /get another recipe/i });
    await user.click(getRecipeButton);

    await waitFor(async () => {
      // Find favorite button
      const favoriteButton = screen.getByTitle(/favorite/i);
      await user.click(favoriteButton);
    }, { timeout: 2000 });

    // Check localStorage was updated
    const favorites = JSON.parse(localStorage.getItem('smoothie-favorites') || '[]');
    expect(favorites.length).toBeGreaterThan(0);
  });

  it('should filter recipes by noFat toggle', async () => {
    const user = userEvent.setup();
    renderApp();

    await waitFor(() => {
      expect(screen.getByLabelText('No Fat')).toBeInTheDocument();
    });

    const noFatToggle = screen.getByLabelText('No Fat');
    await user.click(noFatToggle);

    // Filtered count should update
    await waitFor(() => {
      const countText = screen.getByText(/recipes available/i);
      expect(countText).toBeInTheDocument();
    });
  });

  it('should filter recipes by noNuts toggle', async () => {
    const user = userEvent.setup();
    renderApp();

    await waitFor(() => {
      expect(screen.getByLabelText('No Nuts')).toBeInTheDocument();
    });

    const noNutsToggle = screen.getByLabelText('No Nuts');
    await user.click(noNutsToggle);

    await waitFor(() => {
      const countText = screen.getByText(/recipes available/i);
      expect(countText).toBeInTheDocument();
    });
  });

  it('should filter recipes by favoritesOnly toggle', async () => {
    const user = userEvent.setup();
    renderApp();

    await waitFor(() => {
      expect(screen.getByLabelText(/Favorites Only/i)).toBeInTheDocument();
    });

    const favoritesToggle = screen.getByLabelText(/Favorites Only/i);
    await user.click(favoritesToggle);

    await waitFor(() => {
      // Should show "No favorites yet" message (use getAllByText since it appears in FilterToggles)
      const messages = screen.getAllByText(/no favorites yet/i);
      expect(messages.length).toBeGreaterThan(0);
    });
  });

  it('should open auth modal when user button is clicked and user is not logged in', async () => {
    const user = userEvent.setup();
    renderApp();

    // When not logged in, clicking user button should open auth modal
    const userButton = await screen.findByTitle('Sign in');
    await user.click(userButton);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Sign In/i })).toBeInTheDocument();
    });
  });

  it('should show plus button when viewing a recipe', async () => {
    const user = userEvent.setup();
    renderApp();

    // Wait for recipes to load
    await waitFor(() => {
      expect(screen.getByText(/Community recipes, served fresh/i)).toBeInTheDocument();
    });

    // Get a recipe by clicking "Get Another Recipe"
    const getRecipeButton = screen.getByText('Get Another Recipe');
    await user.click(getRecipeButton);

    // Wait for recipe card to appear (after shaking animation completes)
    await waitFor(() => {
      expect(screen.getByTitle(/favorite/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // User button should still be visible (for sign in when not authenticated)
    const userButton = screen.getByTitle('Sign in');
    expect(userButton).toBeInTheDocument();
  });

  it('should load community recipes on mount', async () => {
    const mockRecipes = [
      {
        id: 'community-1',
        name: 'Community Smoothie',
        contributor: 'Community User',
        emoji: '🥤',
        color: '#9333EA',
        ingredients: ['1 banana'],
        instructions: 'Blend',
        servings: 1,
        prepTime: '5 min',
        containsFat: false,
        containsNuts: false,
      },
    ];

    vi.mocked(communityUtils.fetchCommunityRecipes).mockResolvedValue(mockRecipes);

    renderApp();

    await waitFor(() => {
      expect(communityUtils.fetchCommunityRecipes).toHaveBeenCalled();
    });
  });

  it('should handle recipe submission', async () => {
    const user = userEvent.setup();
    const mockSubmittedRecipe = {
      id: 'new-recipe-1',
      name: 'New Recipe',
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

    vi.mocked(communityUtils.submitCommunityRecipe).mockResolvedValue(mockSubmittedRecipe);

    // Mock authenticated session before rendering
    const { supabase } = await import('./utils/supabase/client');
     
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: { id: 'test-user', email: 'test@example.com' },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      },
      error: null,
    });

    renderApp();

    // Wait for auth to load and plus button to appear
    await waitFor(() => {
      expect(screen.getByTitle('Contribute a recipe')).toBeInTheDocument();
    });

    // Open modal
    const contributeButton = screen.getByTitle('Contribute a recipe');
    await user.click(contributeButton);

    await waitFor(() => {
      expect(screen.getByText('Contribute a Recipe')).toBeInTheDocument();
    });

    // Fill form - wait for modal to be fully rendered
    await waitFor(() => {
      expect(screen.getByLabelText(/recipe name/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/recipe name/i), 'New Recipe');
    // Contributor field should be disabled and pre-filled with user nickname/email when authenticated
    const contributorInput = screen.getByLabelText(/your nickname/i);
    expect(contributorInput).toBeDisabled();
    
    // Use the correct placeholder text
    const ingredientInputs = await screen.findAllByPlaceholderText(/e.g., 1 cup frozen mango/i);
    await user.clear(ingredientInputs[0]);
    await user.type(ingredientInputs[0], '1 banana');
    
    await user.type(screen.getByLabelText(/instructions/i), 'Blend');

    // Submit
    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(communityUtils.submitCommunityRecipe).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('should allow unauthenticated users to contribute recipes', async () => {
    const user = userEvent.setup();
    const mockSubmittedRecipe = {
      id: 'new-recipe-1',
      name: 'Guest Recipe',
      contributor: 'Guest User',
      emoji: '🥤',
      color: '#9333EA',
      ingredients: ['1 banana'],
      instructions: 'Blend',
      servings: 1,
      prepTime: '5 min',
      containsFat: false,
      containsNuts: false,
    };

    vi.mocked(communityUtils.submitCommunityRecipe).mockResolvedValue(mockSubmittedRecipe);

    // Ensure no authenticated session
    const { supabase } = await import('./utils/supabase/client');
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    renderApp();

    // Wait for plus button to appear (should be visible even without auth)
    await waitFor(() => {
      expect(screen.getByTitle('Contribute a recipe')).toBeInTheDocument();
    });

    // Open modal
    const contributeButton = screen.getByTitle('Contribute a recipe');
    await user.click(contributeButton);

    await waitFor(() => {
      expect(screen.getByText('Contribute a Recipe')).toBeInTheDocument();
    });

    // Fill form
    await waitFor(() => {
      expect(screen.getByLabelText(/recipe name/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/recipe name/i), 'Guest Recipe');
    
    // Contributor field should be enabled for unauthenticated users
    const contributorInput = screen.getByLabelText(/your name/i);
    expect(contributorInput).not.toBeDisabled();
    await user.type(contributorInput, 'Guest User');
    
    const ingredientInputs = await screen.findAllByPlaceholderText(/e.g., 1 cup frozen mango/i);
    await user.clear(ingredientInputs[0]);
    await user.type(ingredientInputs[0], '1 banana');
    
    await user.type(screen.getByLabelText(/instructions/i), 'Blend');

    // Submit
    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(communityUtils.submitCommunityRecipe).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Guest Recipe',
          contributor: 'Guest User',
        })
      );
    }, { timeout: 3000 });
  });

  it('should persist favorites to localStorage', async () => {
    const user = userEvent.setup();
    renderApp();

    // Get a recipe and favorite it
    const getRecipeButton = await screen.findByRole('button', { name: /get another recipe/i });
    await user.click(getRecipeButton);

    await waitFor(async () => {
      const favoriteButton = screen.getByTitle(/favorite/i);
      await user.click(favoriteButton);
    }, { timeout: 2000 });

    // Check localStorage
    const favorites = JSON.parse(localStorage.getItem('smoothie-favorites') || '[]');
    expect(favorites.length).toBeGreaterThan(0);
  });

  it('should load recipe from URL parameter', async () => {
    // Set URL parameter
    const searchParams = new URLSearchParams();
    searchParams.set('recipe', '1');
    window.history.pushState({}, '', `?${searchParams.toString()}`);

    renderApp();

    await waitFor(() => {
      // Should show a recipe (not the shake instruction)
      expect(screen.queryByText(/shake your device/i)).not.toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('should load contributor list from URL parameter', async () => {
    // Mock community recipes with a specific contributor
    const mockRecipes = [
      {
        id: 'community-1',
        name: 'Community Smoothie',
        contributor: 'Test Contributor',
        emoji: '🥤',
        color: '#9333EA',
        ingredients: ['1 banana'],
        instructions: 'Blend',
        createdAt: '2024-01-01',
      },
    ];
    vi.mocked(communityUtils.fetchCommunityRecipes).mockResolvedValue(mockRecipes);

    // Set URL parameter
    const searchParams = new URLSearchParams();
    searchParams.set('contributor', 'Test Contributor');
    window.history.pushState({}, '', `?${searchParams.toString()}`);

    renderApp();

    await waitFor(() => {
      // Should show contributor's recipes view
      expect(screen.getByText(/Recipes by Test Contributor/i)).toBeInTheDocument();
      expect(screen.getByTitle(/Share this contributor's recipes/i)).toBeInTheDocument();
    });
  });

  it('should handle recipe update', async () => {
    const user = userEvent.setup();
    const mockExistingRecipe = {
      id: 'recipe:1762405222159:19kx5',
      name: 'Original Recipe',
      contributor: 'test@example.com',
      emoji: '🥤',
      color: '#9333EA',
      ingredients: ['1 banana'],
      instructions: 'Blend',
      servings: 1,
      prepTime: '5 min',
      containsFat: false,
      containsNuts: false,
      createdAt: '2024-01-01',
    };

    const mockUpdatedRecipe = {
      ...mockExistingRecipe,
      name: 'Updated Recipe',
      ingredients: ['2 bananas', '1 cup milk'],
      instructions: 'Blend well',
    };

    // Mock authenticated session first
    const { supabase } = await import('./utils/supabase/client');
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: { id: 'test-user', email: 'test@example.com', user_metadata: {} },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      },
      error: null,
    });

    // Mock fetchCommunityRecipes to return the recipe
    vi.mocked(communityUtils.fetchCommunityRecipes).mockResolvedValue([mockExistingRecipe]);
    vi.mocked(communityUtils.updateCommunityRecipe).mockResolvedValue(mockUpdatedRecipe);

    renderApp();

    // Wait for recipes to load and auth to initialize
    await waitFor(() => {
      expect(screen.getByTitle('Contribute a recipe')).toBeInTheDocument();
    });

    // Wait for the recipe list to be available
    await waitFor(() => {
      expect(communityUtils.fetchCommunityRecipes).toHaveBeenCalled();
    });

    // Shake to get a recipe - the mock recipe should appear
    const shakeButton = await screen.findByRole('button', { name: /get another recipe|shake/i });
    await user.click(shakeButton);

    // Wait for recipe to appear - it should show the mock recipe
    await waitFor(() => {
      expect(screen.getByText('Original Recipe')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Click edit button (should be visible for user's own recipe)
    const editButton = await screen.findByTitle('Edit recipe');
    await user.click(editButton);

    // Wait for edit modal
    await waitFor(() => {
      expect(screen.getByText('Edit Recipe')).toBeInTheDocument();
    });

    // Update the recipe name
    const nameInput = screen.getByLabelText(/recipe name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Recipe');

    // Update ingredients
    const ingredientInputs = await screen.findAllByPlaceholderText(/e.g., 1 cup frozen mango/i);
    await user.clear(ingredientInputs[0]);
    await user.type(ingredientInputs[0], '2 bananas');
    
    // Add another ingredient - button text is just "Add"
    const addIngredientButton = screen.getByRole('button', { name: /^add$/i });
    await user.click(addIngredientButton);
    const newIngredientInputs = await screen.findAllByPlaceholderText(/e.g., 1 cup frozen mango/i);
    await user.type(newIngredientInputs[newIngredientInputs.length - 1], '1 cup milk');

    // Update instructions
    const instructionsInput = screen.getByLabelText(/instructions/i);
    await user.clear(instructionsInput);
    await user.type(instructionsInput, 'Blend well');

    // Submit update
    const updateButton = screen.getByRole('button', { name: /update recipe/i });
    await user.click(updateButton);

    // Verify update was called
    await waitFor(() => {
      expect(communityUtils.updateCommunityRecipe).toHaveBeenCalledWith(
        'recipe:1762405222159:19kx5',
        expect.objectContaining({
          name: 'Updated Recipe',
          contributor: 'test@example.com',
          ingredients: expect.arrayContaining(['2 bananas', '1 cup milk']),
          instructions: 'Blend well',
        })
      );
    }, { timeout: 3000 });

    // Verify success message
    await waitFor(() => {
      expect(screen.getByText('Your recipe has been updated')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should disable "Get Another Recipe" button when no recipes match filters', async () => {
    const user = userEvent.setup();
    renderApp();

    // Enable all filters that would exclude all recipes
    const noFatToggle = await screen.findByLabelText('No Fat');
    const noNutsToggle = screen.getByLabelText('No Nuts');
    const favoritesToggle = screen.getByLabelText(/Favorites Only/i);

    await user.click(noFatToggle);
    await user.click(noNutsToggle);
    await user.click(favoritesToggle);

    await waitFor(() => {
      const getRecipeButton = screen.getByRole('button', { name: /get another recipe/i });
      expect(getRecipeButton).toBeDisabled();
    });
  });
});

