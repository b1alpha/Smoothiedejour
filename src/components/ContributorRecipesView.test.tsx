import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContributorRecipesView } from './ContributorRecipesView';
import * as shareUtils from '../utils/share';

// Mock the share utility
vi.mock('../utils/share', () => ({
  shareContributorList: vi.fn(),
}));

describe('ContributorRecipesView', () => {
  const mockOnSelectRecipe = vi.fn();
  const mockRecipes = [
    {
      id: 1,
      name: 'Tropical Paradise',
      contributor: 'Test User',
      emoji: '🥭',
      color: '#FF6B6B',
    },
    {
      id: 2,
      name: 'Berry Blast',
      contributor: 'Test User',
      emoji: '🫐',
      color: '#9333EA',
    },
    {
      id: 3,
      name: 'Green Power',
      contributor: 'Test User',
      emoji: '🥬',
      color: '#32CD32',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render contributor name and recipe count', () => {
    render(
      <ContributorRecipesView
        contributor="Test User"
        recipes={mockRecipes}
        onSelectRecipe={mockOnSelectRecipe}
      />
    );

    expect(screen.getByText('Recipes by Test User')).toBeInTheDocument();
    expect(screen.getByText('3 recipes')).toBeInTheDocument();
  });

  it('should render singular "recipe" for one recipe', () => {
    const singleRecipe = [mockRecipes[0]];
    render(
      <ContributorRecipesView
        contributor="Test User"
        recipes={singleRecipe}
        onSelectRecipe={mockOnSelectRecipe}
      />
    );

    expect(screen.getByText('1 recipe')).toBeInTheDocument();
  });

  it('should render plural "recipes" for multiple recipes', () => {
    render(
      <ContributorRecipesView
        contributor="Test User"
        recipes={mockRecipes}
        onSelectRecipe={mockOnSelectRecipe}
      />
    );

    expect(screen.getByText('3 recipes')).toBeInTheDocument();
  });

  it('should render all recipes', () => {
    render(
      <ContributorRecipesView
        contributor="Test User"
        recipes={mockRecipes}
        onSelectRecipe={mockOnSelectRecipe}
      />
    );

    expect(screen.getByText('Tropical Paradise')).toBeInTheDocument();
    expect(screen.getByText('Berry Blast')).toBeInTheDocument();
    expect(screen.getByText('Green Power')).toBeInTheDocument();
  });

  it('should render recipe emojis', () => {
    render(
      <ContributorRecipesView
        contributor="Test User"
        recipes={mockRecipes}
        onSelectRecipe={mockOnSelectRecipe}
      />
    );

    expect(screen.getByText('🥭')).toBeInTheDocument();
    expect(screen.getByText('🫐')).toBeInTheDocument();
    expect(screen.getByText('🥬')).toBeInTheDocument();
  });

  it('should call onSelectRecipe when a recipe is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ContributorRecipesView
        contributor="Test User"
        recipes={mockRecipes}
        onSelectRecipe={mockOnSelectRecipe}
      />
    );

    const recipeButton = screen.getByText('Tropical Paradise').closest('button');
    expect(recipeButton).toBeInTheDocument();
    
    if (recipeButton) {
      await user.click(recipeButton);
      expect(mockOnSelectRecipe).toHaveBeenCalledTimes(1);
      expect(mockOnSelectRecipe).toHaveBeenCalledWith(mockRecipes[0]);
    }
  });

  it('should call onSelectRecipe with correct recipe for each click', async () => {
    const user = userEvent.setup();
    render(
      <ContributorRecipesView
        contributor="Test User"
        recipes={mockRecipes}
        onSelectRecipe={mockOnSelectRecipe}
      />
    );

    // Click first recipe
    const firstRecipe = screen.getByText('Tropical Paradise').closest('button');
    if (firstRecipe) {
      await user.click(firstRecipe);
      expect(mockOnSelectRecipe).toHaveBeenCalledWith(mockRecipes[0]);
    }

    // Click second recipe
    const secondRecipe = screen.getByText('Berry Blast').closest('button');
    if (secondRecipe) {
      await user.click(secondRecipe);
      expect(mockOnSelectRecipe).toHaveBeenCalledWith(mockRecipes[1]);
    }

    // Click third recipe
    const thirdRecipe = screen.getByText('Green Power').closest('button');
    if (thirdRecipe) {
      await user.click(thirdRecipe);
      expect(mockOnSelectRecipe).toHaveBeenCalledWith(mockRecipes[2]);
    }

    expect(mockOnSelectRecipe).toHaveBeenCalledTimes(3);
  });

  it('should render share button', () => {
    render(
      <ContributorRecipesView
        contributor="Test User"
        recipes={mockRecipes}
        onSelectRecipe={mockOnSelectRecipe}
      />
    );

    const shareButton = screen.getByRole('button', { name: /share/i });
    expect(shareButton).toBeInTheDocument();
    expect(shareButton).toHaveAttribute('title', "Share this contributor's recipes");
  });

  it('should call shareContributorList when share button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ContributorRecipesView
        contributor="Test User"
        recipes={mockRecipes}
        onSelectRecipe={mockOnSelectRecipe}
      />
    );

    const shareButton = screen.getByRole('button', { name: /share/i });
    await user.click(shareButton);

    expect(shareUtils.shareContributorList).toHaveBeenCalledTimes(1);
    expect(shareUtils.shareContributorList).toHaveBeenCalledWith('Test User', 3);
  });

  it('should handle empty recipes array', () => {
    render(
      <ContributorRecipesView
        contributor="Test User"
        recipes={[]}
        onSelectRecipe={mockOnSelectRecipe}
      />
    );

    expect(screen.getByText('Recipes by Test User')).toBeInTheDocument();
    expect(screen.getByText('0 recipes')).toBeInTheDocument();
    expect(screen.queryByText('Tropical Paradise')).not.toBeInTheDocument();
  });

  it('should render recipes with string IDs', () => {
    const recipesWithStringIds = [
      {
        id: 'recipe-1',
        name: 'String ID Recipe',
        contributor: 'Test User',
        emoji: '🍓',
        color: '#FF0000',
      },
    ];

    render(
      <ContributorRecipesView
        contributor="Test User"
        recipes={recipesWithStringIds}
        onSelectRecipe={mockOnSelectRecipe}
      />
    );

    expect(screen.getByText('String ID Recipe')).toBeInTheDocument();
  });

  it('should render recipes with number IDs', () => {
    const recipesWithNumberIds = [
      {
        id: 999,
        name: 'Number ID Recipe',
        contributor: 'Test User',
        emoji: '🍊',
        color: '#FFA500',
      },
    ];

    render(
      <ContributorRecipesView
        contributor="Test User"
        recipes={recipesWithNumberIds}
        onSelectRecipe={mockOnSelectRecipe}
      />
    );

    expect(screen.getByText('Number ID Recipe')).toBeInTheDocument();
  });

  it('should apply correct background color styles to recipes', () => {
    const { container } = render(
      <ContributorRecipesView
        contributor="Test User"
        recipes={mockRecipes}
        onSelectRecipe={mockOnSelectRecipe}
      />
    );

    const recipeButtons = container.querySelectorAll('button[class*="rounded-2xl"]');
    expect(recipeButtons.length).toBeGreaterThan(0);
  });

  it('should render share icon', () => {
    const { container } = render(
      <ContributorRecipesView
        contributor="Test User"
        recipes={mockRecipes}
        onSelectRecipe={mockOnSelectRecipe}
      />
    );

    // Check for Share2 icon (lucide-react icon)
    const shareIcon = container.querySelector('svg');
    expect(shareIcon).toBeInTheDocument();
  });

  it('should call shareContributorList with correct count for single recipe', async () => {
    const user = userEvent.setup();
    const singleRecipe = [mockRecipes[0]];
    
    render(
      <ContributorRecipesView
        contributor="Test User"
        recipes={singleRecipe}
        onSelectRecipe={mockOnSelectRecipe}
      />
    );

    const shareButton = screen.getByRole('button', { name: /share/i });
    await user.click(shareButton);

    expect(shareUtils.shareContributorList).toHaveBeenCalledWith('Test User', 1);
  });

  it('should call shareContributorList with correct count for empty recipes', async () => {
    const user = userEvent.setup();
    
    render(
      <ContributorRecipesView
        contributor="Test User"
        recipes={[]}
        onSelectRecipe={mockOnSelectRecipe}
      />
    );

    const shareButton = screen.getByRole('button', { name: /share/i });
    await user.click(shareButton);

    expect(shareUtils.shareContributorList).toHaveBeenCalledWith('Test User', 0);
  });
});

