import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import * as communityUtils from './utils/supabase/community';
import { smoothieRecipes } from './data/recipes';

// Mock the community utils
vi.mock('./utils/supabase/community', () => ({
  fetchCommunityRecipes: vi.fn(),
  submitCommunityRecipe: vi.fn(),
}));

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
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Smoothie de Jour')).toBeInTheDocument();
    });
  });

  it('should display recipe count in header', async () => {
    render(<App />);

    await waitFor(() => {
      const headerText = screen.getByText(/Community recipes, served fresh/i);
      expect(headerText).toBeInTheDocument();
      expect(headerText.textContent).toContain(`${smoothieRecipes.length} recipes`);
    });
  });

  it('should show shake instruction when no recipe is selected', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/shake your phone/i)).toBeInTheDocument();
    });
  });

  it('should display a random recipe when "Get Another Recipe" is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);

    const getRecipeButton = await screen.findByRole('button', { name: /get another recipe/i });
    await user.click(getRecipeButton);

    await waitFor(() => {
      // Should show a recipe card
      expect(screen.queryByText(/shake your device/i)).not.toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('should toggle favorite when favorite button is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);

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
    render(<App />);

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
    render(<App />);

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
    render(<App />);

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

  it('should open contribute modal when plus button is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);

    const contributeButton = await screen.findByTitle('Contribute a recipe');
    await user.click(contributeButton);

    await waitFor(() => {
      expect(screen.getByText('Contribute a Recipe')).toBeInTheDocument();
    });
  });

  it('should show plus button when viewing a recipe', async () => {
    const user = userEvent.setup();
    render(<App />);

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

    // Plus button should still be visible
    const contributeButton = screen.getByTitle('Contribute a recipe');
    expect(contributeButton).toBeInTheDocument();
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

    render(<App />);

    await waitFor(() => {
      expect(communityUtils.fetchCommunityRecipes).toHaveBeenCalled();
    });
  });

  it('should handle recipe submission', async () => {
    const user = userEvent.setup();
    const mockSubmittedRecipe = {
      id: 'new-recipe-1',
      name: 'New Recipe',
      contributor: 'Test User',
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

    render(<App />);

    // Open modal
    const contributeButton = await screen.findByTitle('Contribute a recipe');
    await user.click(contributeButton);

    await waitFor(() => {
      expect(screen.getByText('Contribute a Recipe')).toBeInTheDocument();
    });

    // Fill form - wait for modal to be fully rendered
    await waitFor(() => {
      expect(screen.getByLabelText(/recipe name/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/recipe name/i), 'New Recipe');
    await user.type(screen.getByLabelText(/your name/i), 'Test User');
    
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

  it('should persist favorites to localStorage', async () => {
    const user = userEvent.setup();
    render(<App />);

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

    render(<App />);

    await waitFor(() => {
      // Should show a recipe (not the shake instruction)
      expect(screen.queryByText(/shake your device/i)).not.toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('should disable "Get Another Recipe" button when no recipes match filters', async () => {
    const user = userEvent.setup();
    render(<App />);

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

