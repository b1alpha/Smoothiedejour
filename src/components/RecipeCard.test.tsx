import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecipeCard } from './RecipeCard';
import * as shareUtils from '../utils/share';

const mockRecipe = {
  id: 1,
  name: 'Test Smoothie',
  contributor: 'Test User',
  emoji: '🥤',
  color: '#9333EA',
  ingredients: ['1 banana', '1 cup milk'],
  instructions: 'Blend everything together',
  servings: 2,
  prepTime: '5 min',
};

describe('RecipeCard', () => {
  const mockToggleFavorite = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render recipe information', () => {
    render(
      <RecipeCard
        recipe={mockRecipe}
        isFavorite={false}
        onToggleFavorite={mockToggleFavorite}
      />
    );

    expect(screen.getByText('Test Smoothie')).toBeInTheDocument();
    expect(screen.getByText('by Test User')).toBeInTheDocument();
    expect(screen.getByText('🥤')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('5 min')).toBeInTheDocument();
    expect(screen.getByText('1 banana')).toBeInTheDocument();
    expect(screen.getByText('1 cup milk')).toBeInTheDocument();
    expect(screen.getByText('Blend everything together')).toBeInTheDocument();
  });

  it('should show favorite button', () => {
    render(
      <RecipeCard
        recipe={mockRecipe}
        isFavorite={false}
        onToggleFavorite={mockToggleFavorite}
      />
    );

    const favoriteButton = screen.getByTitle('Add to favorites');
    expect(favoriteButton).toBeInTheDocument();
  });

  it('should show filled heart when recipe is favorite', () => {
    render(
      <RecipeCard
        recipe={mockRecipe}
        isFavorite={true}
        onToggleFavorite={mockToggleFavorite}
      />
    );

    const favoriteButton = screen.getByTitle('Remove from favorites');
    expect(favoriteButton).toBeInTheDocument();
  });

  it('should call onToggleFavorite when favorite button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <RecipeCard
        recipe={mockRecipe}
        isFavorite={false}
        onToggleFavorite={mockToggleFavorite}
      />
    );

    const favoriteButton = screen.getByTitle('Add to favorites');
    await user.click(favoriteButton);

    expect(mockToggleFavorite).toHaveBeenCalledWith(1);
  });

  it('should call shareRecipe when share button is clicked', async () => {
    const user = userEvent.setup();
    const mockShareRecipe = vi.spyOn(shareUtils, 'shareRecipe').mockResolvedValue(true);

    // Mock navigator.share as undefined to use clipboard fallback
    Object.defineProperty(navigator, 'share', {
      writable: true,
      value: undefined,
    });

    render(
      <RecipeCard
        recipe={mockRecipe}
        isFavorite={false}
        onToggleFavorite={mockToggleFavorite}
      />
    );

    const shareButton = screen.getByTitle('Share recipe');
    await user.click(shareButton);

    expect(mockShareRecipe).toHaveBeenCalledWith(mockRecipe);
    
    // Wait for toast to appear
    await waitFor(() => {
      expect(screen.getByText('Link copied to clipboard!')).toBeInTheDocument();
    });

    mockShareRecipe.mockRestore();
  });

  it('should show error toast when share fails', async () => {
    const user = userEvent.setup();
    const mockShareRecipe = vi.spyOn(shareUtils, 'shareRecipe').mockResolvedValue(false);

    Object.defineProperty(navigator, 'share', {
      writable: true,
      value: undefined,
    });

    render(
      <RecipeCard
        recipe={mockRecipe}
        isFavorite={false}
        onToggleFavorite={mockToggleFavorite}
      />
    );

    const shareButton = screen.getByTitle('Share recipe');
    await user.click(shareButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to share. Please try again.')).toBeInTheDocument();
    });

    mockShareRecipe.mockRestore();
  });
});

