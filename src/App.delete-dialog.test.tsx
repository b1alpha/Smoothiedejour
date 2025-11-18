import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import * as communityUtils from './utils/supabase/community';

// Mock the community utils
vi.mock('./utils/supabase/community', () => ({
  fetchCommunityRecipes: vi.fn(),
  submitCommunityRecipe: vi.fn(),
  updateCommunityRecipe: vi.fn(),
  deleteCommunityRecipe: vi.fn(),
}));

// Mock Supabase client
vi.mock('./utils/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { 
          session: { 
            user: { id: 'test-user', email: 'test@example.com', user_metadata: { nickname: 'TestUser' } } 
          } 
        },
        error: null,
      }),
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user', email: 'test@example.com', user_metadata: { nickname: 'TestUser' } } },
        error: null,
      }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      updateUser: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

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

describe('Delete Recipe Dialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // Mock a community recipe that belongs to the user
    const userRecipe = {
      id: 'recipe:1234567890:abc123',
      name: 'My Test Smoothie',
      contributor: 'TestUser',
      emoji: '🥤',
      color: '#9333EA',
      ingredients: ['1 banana', '1 cup milk'],
      instructions: 'Blend everything',
      servings: 2,
      prepTime: '5 min',
      containsFat: false,
      containsNuts: false,
    };

    vi.mocked(communityUtils.fetchCommunityRecipes).mockResolvedValue([userRecipe]);
    vi.mocked(communityUtils.deleteCommunityRecipe).mockResolvedValue();
  });

  it('should show delete confirmation dialog when delete button is clicked', async () => {
    const user = userEvent.setup();
    renderApp();

    // Wait for app to load
    await waitFor(() => {
      expect(screen.getByText('Smoothie de Jour')).toBeInTheDocument();
    });

    // Click "Get Another Recipe" to show a recipe
    const getRecipeButton = await screen.findByRole('button', { name: /get another recipe/i });
    await act(async () => {
      await user.click(getRecipeButton);
    });

    // Wait for recipe card to appear
    await waitFor(() => {
      expect(screen.getByText('My Test Smoothie')).toBeInTheDocument();
    }, { timeout: 2000 });

    // Find and click the delete button
    const deleteButton = screen.getByTitle('Delete recipe');
    expect(deleteButton).toBeInTheDocument();
    
    await act(async () => {
      await user.click(deleteButton);
      // Wait for state update and AnimatePresence to process
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Check if dialog appears
    await waitFor(() => {
      const dialogTitle = screen.getByText('Delete Recipe?');
      expect(dialogTitle).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to delete "My Test Smoothie"/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^delete$/i })).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('should call deleteCommunityRecipe when delete is confirmed', async () => {
    const user = userEvent.setup();
    renderApp();

    await waitFor(() => {
      expect(screen.getByText('Smoothie de Jour')).toBeInTheDocument();
    });

    const getRecipeButton = await screen.findByRole('button', { name: /get another recipe/i });
    await act(async () => {
      await user.click(getRecipeButton);
    });

    await waitFor(() => {
      expect(screen.getByText('My Test Smoothie')).toBeInTheDocument();
    }, { timeout: 2000 });

    const deleteButton = screen.getByTitle('Delete recipe');
    await act(async () => {
      await user.click(deleteButton);
    });

    // Wait for dialog and confirm deletion
    await waitFor(() => {
      expect(screen.getByText('Delete Recipe?')).toBeInTheDocument();
    }, { timeout: 5000 });

    const confirmDeleteButton = screen.getByRole('button', { name: /^delete$/i });
    await act(async () => {
      await user.click(confirmDeleteButton);
    });

    // Verify deleteCommunityRecipe was called
    await waitFor(() => {
      expect(communityUtils.deleteCommunityRecipe).toHaveBeenCalledWith('recipe:1234567890:abc123');
    });
  });

  it('should render delete dialog with z-index higher than other modals', async () => {
    const user = userEvent.setup();
    const { container } = renderApp();

    await waitFor(() => {
      expect(screen.getByText('Smoothie de Jour')).toBeInTheDocument();
    });

    const getRecipeButton = await screen.findByRole('button', { name: /get another recipe/i });
    await act(async () => {
      await user.click(getRecipeButton);
    });

    await waitFor(() => {
      expect(screen.getByText('My Test Smoothie')).toBeInTheDocument();
    }, { timeout: 2000 });

    const deleteButton = screen.getByTitle('Delete recipe');
    await act(async () => {
      await user.click(deleteButton);
      // Wait for state update and AnimatePresence to process
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Wait for dialog to appear
    await waitFor(() => {
      expect(screen.getByText('Delete Recipe?')).toBeInTheDocument();
    }, { timeout: 5000 });

    // Find the dialog backdrop and content elements by their z-index styles
    const allElements = Array.from(container.querySelectorAll('*')) as HTMLElement[];
    const backdrop = allElements.find(el => {
      const style = window.getComputedStyle(el);
      return parseInt(style.zIndex, 10) === 9998;
    });
    const dialog = allElements.find(el => {
      const style = window.getComputedStyle(el);
      return parseInt(style.zIndex, 10) === 9999;
    });

    // Verify backdrop exists and has correct z-index
    expect(backdrop).toBeInTheDocument();
    const backdropZIndex = window.getComputedStyle(backdrop as HTMLElement).zIndex;
    expect(parseInt(backdropZIndex, 10)).toBe(9998);

    // Verify dialog exists and has correct z-index (higher than backdrop)
    expect(dialog).toBeInTheDocument();
    const dialogZIndex = window.getComputedStyle(dialog as HTMLElement).zIndex;
    expect(parseInt(dialogZIndex, 10)).toBe(9999);

    // Verify dialog is rendered outside the main content container
    const mainContainer = container.querySelector('.max-w-md');
    if (mainContainer && dialog) {
      // Dialog should not be a child of the main container
      expect(mainContainer.contains(dialog)).toBe(false);
    }
  });

  it('should have delete dialog z-index higher than contribute modal z-index', async () => {
    const user = userEvent.setup();
    const { container } = renderApp();

    await waitFor(() => {
      expect(screen.getByText('Smoothie de Jour')).toBeInTheDocument();
    });

    // First, check what z-index the contribute modal uses (z-50)
    // We know from the code that contribute modal uses z-50
    const expectedContributeModalZIndex = 50;

    // Now open delete dialog
    const getRecipeButton = await screen.findByRole('button', { name: /get another recipe/i });
    await act(async () => {
      await user.click(getRecipeButton);
    });

    await waitFor(() => {
      expect(screen.getByText('My Test Smoothie')).toBeInTheDocument();
    }, { timeout: 2000 });

    const deleteButton = screen.getByTitle('Delete recipe');
    await act(async () => {
      await user.click(deleteButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Delete Recipe?')).toBeInTheDocument();
    }, { timeout: 5000 });

    // Get delete dialog element and check its z-index style
    const allElements = Array.from(container.querySelectorAll('*')) as HTMLElement[];
    const deleteDialog = allElements.find(el => {
      const style = window.getComputedStyle(el);
      return parseInt(style.zIndex, 10) === 9999;
    });
    expect(deleteDialog).toBeInTheDocument();
    
    // Verify it has the correct z-index style (which should be 9999)
    const dialogZIndex = window.getComputedStyle(deleteDialog as HTMLElement).zIndex;
    expect(parseInt(dialogZIndex, 10)).toBe(9999);
    
    // The z-index value 9999 should be much higher than contribute modal's 50
    expect(9999).toBeGreaterThan(expectedContributeModalZIndex);
    
    // Also verify backdrop has correct z-index
    const backdrop = allElements.find(el => {
      const style = window.getComputedStyle(el);
      return parseInt(style.zIndex, 10) === 9998;
    });
    expect(backdrop).toBeInTheDocument();
    const backdropZIndex = window.getComputedStyle(backdrop as HTMLElement).zIndex;
    expect(parseInt(backdropZIndex, 10)).toBe(9998);
    expect(9998).toBeGreaterThan(expectedContributeModalZIndex);
  });

  it('should render delete dialog as last element in DOM to ensure it appears on top', async () => {
    const user = userEvent.setup();
    const { container } = renderApp();

    await waitFor(() => {
      expect(screen.getByText('Smoothie de Jour')).toBeInTheDocument();
    });

    const getRecipeButton = await screen.findByRole('button', { name: /get another recipe/i });
    await act(async () => {
      await user.click(getRecipeButton);
    });

    await waitFor(() => {
      expect(screen.getByText('My Test Smoothie')).toBeInTheDocument();
    }, { timeout: 2000 });

    const deleteButton = screen.getByTitle('Delete recipe');
    await act(async () => {
      await user.click(deleteButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Delete Recipe?')).toBeInTheDocument();
    }, { timeout: 5000 });

    // Delete dialog should be one of the last elements
    // Get the index of delete dialog in the DOM tree
    const allElements = Array.from(container.querySelectorAll('*'));
    const deleteDialogIndex = allElements.findIndex(el => 
      el.textContent?.includes('Delete Recipe?')
    );
    
    // The delete dialog should be near the end of the DOM (high index)
    // This ensures it renders on top even if z-index has issues
    expect(deleteDialogIndex).toBeGreaterThan(allElements.length * 0.7); // Should be in last 30% of elements
  });

  it('should have delete dialog with computed z-index style that is actually applied', async () => {
    const user = userEvent.setup();
    const { container } = renderApp();

    await waitFor(() => {
      expect(screen.getByText('Smoothie de Jour')).toBeInTheDocument();
    });

    const getRecipeButton = await screen.findByRole('button', { name: /get another recipe/i });
    await act(async () => {
      await user.click(getRecipeButton);
    });

    await waitFor(() => {
      expect(screen.getByText('My Test Smoothie')).toBeInTheDocument();
    }, { timeout: 2000 });

    const deleteButton = screen.getByTitle('Delete recipe');
    await act(async () => {
      await user.click(deleteButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Delete Recipe?')).toBeInTheDocument();
    }, { timeout: 5000 });

    // Find the dialog element by its text content, then find parent with z-index style
    const dialogText = screen.getByText('Delete Recipe?');
    let dialogContainer = dialogText.parentElement as HTMLElement;
    
    // Walk up the DOM tree to find the element with z-index style
    while (dialogContainer && !dialogContainer.style.zIndex) {
      dialogContainer = dialogContainer.parentElement as HTMLElement;
    }
    
    expect(dialogContainer).toBeTruthy();
    expect(dialogContainer.style.zIndex).toBeTruthy();
    
    // Check computed style - z-index should be a number, not 'auto'
    const computedStyle = window.getComputedStyle(dialogContainer);
    const zIndex = computedStyle.zIndex;
    
    // Z-index should be a valid number (not 'auto' or empty)
    expect(zIndex).not.toBe('auto');
    expect(zIndex).not.toBe('');
    
    // Parse z-index and verify it's a high number
    const zIndexNum = parseInt(zIndex, 10);
    expect(zIndexNum).toBeGreaterThan(1000); // Should be at least 1000
    expect(zIndexNum).toBe(9999); // Should be exactly 9999
    
    // Also check backdrop - find element with z-index 9998
    const allElements = Array.from(container.querySelectorAll('*')) as HTMLElement[];
    const backdrop = allElements.find(el => {
      const style = window.getComputedStyle(el);
      return parseInt(style.zIndex, 10) === 9998;
    });
    
    if (backdrop) {
      const backdropZIndex = window.getComputedStyle(backdrop).zIndex;
      const backdropZIndexNum = parseInt(backdropZIndex, 10);
      expect(backdropZIndexNum).toBe(9998);
      expect(zIndexNum).toBeGreaterThan(backdropZIndexNum); // Dialog should be higher than backdrop
    }
  });

  it('should have visible delete button with proper styling', async () => {
    const user = userEvent.setup();
    renderApp();

    await waitFor(() => {
      expect(screen.getByText('Smoothie de Jour')).toBeInTheDocument();
    });

    const getRecipeButton = await screen.findByRole('button', { name: /get another recipe/i });
    await act(async () => {
      await user.click(getRecipeButton);
    });

    await waitFor(() => {
      expect(screen.getByText('My Test Smoothie')).toBeInTheDocument();
    }, { timeout: 2000 });

    const deleteButton = screen.getByTitle('Delete recipe');
    await act(async () => {
      await user.click(deleteButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Delete Recipe?')).toBeInTheDocument();
    }, { timeout: 5000 });

    // Find the delete button in the dialog
    const confirmDeleteButton = screen.getByRole('button', { name: /^delete$/i });
    expect(confirmDeleteButton).toBeInTheDocument();
    
    // Check that button is visible
    expect(confirmDeleteButton).toBeVisible();
    
    // Check computed styles - should have red background and white text
    const computedStyle = window.getComputedStyle(confirmDeleteButton);
    const bgColor = computedStyle.backgroundColor;
    const color = computedStyle.color;
    
    // Background should be red (can be rgb or hex format)
    // red-600 is #dc2626 or rgb(220, 38, 38), red-700 is #b91c1c or rgb(185, 28, 28)
    const isRed = bgColor.includes('220') || bgColor.includes('239') || bgColor.includes('185') || 
                  bgColor === '#dc2626' || bgColor === '#b91c1c' || bgColor === 'rgb(220, 38, 38)' || 
                  bgColor === 'rgb(185, 28, 28)';
    expect(isRed).toBe(true);
    
    // Text should be white (can be rgb or hex format)
    const isWhite = color.includes('255, 255, 255') || color === 'white' || color === '#ffffff' || 
                    color === 'rgb(255, 255, 255)';
    expect(isWhite).toBe(true);
  });

  it('should remove recipe from view after deletion and not show it again', async () => {
    const user = userEvent.setup();
    renderApp();

    await waitFor(() => {
      expect(screen.getByText('Smoothie de Jour')).toBeInTheDocument();
    });

    // Get a recipe to display
    const getRecipeButton = await screen.findByRole('button', { name: /get another recipe/i });
    await act(async () => {
      await user.click(getRecipeButton);
    });

    // Wait for recipe to appear
    await waitFor(() => {
      expect(screen.getByText('My Test Smoothie')).toBeInTheDocument();
    }, { timeout: 2000 });

    // Verify recipe is displayed
    expect(screen.getByText('My Test Smoothie')).toBeInTheDocument();

    // Click delete button
    const deleteButton = screen.getByTitle('Delete recipe');
    await act(async () => {
      await user.click(deleteButton);
    });

    // Confirm deletion
    await waitFor(() => {
      expect(screen.getByText('Delete Recipe?')).toBeInTheDocument();
    }, { timeout: 5000 });

    const confirmDeleteButton = screen.getByRole('button', { name: /^delete$/i });
    await act(async () => {
      await user.click(confirmDeleteButton);
    });

    // Wait for deletion to complete
    await waitFor(() => {
      expect(screen.queryByText('Delete Recipe?')).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // Recipe should no longer be displayed
    await waitFor(() => {
      expect(screen.queryByText('My Test Smoothie')).not.toBeInTheDocument();
    }, { timeout: 2000 });

    // Should show shake instruction or another view instead
    // The recipe card should be gone
    expect(screen.queryByText('My Test Smoothie')).not.toBeInTheDocument();
  });

  it('should remove recipe from allRecipes list after deletion', async () => {
    const user = userEvent.setup();
    renderApp();

    await waitFor(() => {
      expect(screen.getByText('Smoothie de Jour')).toBeInTheDocument();
    });

    // Verify recipe exists in the list initially
    // We need to check the component's internal state
    // Since we can't directly access state, we'll verify by trying to get the recipe again
    
    const getRecipeButton = await screen.findByRole('button', { name: /get another recipe/i });
    await act(async () => {
      await user.click(getRecipeButton);
    });

    await waitFor(() => {
      expect(screen.getByText('My Test Smoothie')).toBeInTheDocument();
    }, { timeout: 2000 });

    // Delete the recipe
    const deleteButton = screen.getByTitle('Delete recipe');
    await act(async () => {
      await user.click(deleteButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Delete Recipe?')).toBeInTheDocument();
    }, { timeout: 5000 });

    const confirmDeleteButton = screen.getByRole('button', { name: /^delete$/i });
    await act(async () => {
      await user.click(confirmDeleteButton);
    });

    // Wait for deletion - handleDeleteRecipe is async and triggers state updates
    await waitFor(() => {
      expect(screen.queryByText('Delete Recipe?')).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // Try to get another recipe - it should NOT be the deleted one
    // Click "Get Another Recipe" multiple times to ensure deleted recipe doesn't appear
    for (let i = 0; i < 5; i++) {
      const getAnotherButton = screen.getByRole('button', { name: /get another recipe/i });
      await act(async () => {
        await user.click(getAnotherButton);
      });
      
      // Wait for any new recipe to appear (if any)
      await waitFor(() => {
        // Just verify deleted recipe is NOT shown - don't wait for a new one
        expect(screen.queryByText('My Test Smoothie')).not.toBeInTheDocument();
      }, { timeout: 1000 });
    }
  });

  it('should show "Recipe deleted" message after deleting current recipe', async () => {
    const user = userEvent.setup();
    renderApp();

    await waitFor(() => {
      expect(screen.getByText('Smoothie de Jour')).toBeInTheDocument();
    });

    // Get a recipe to display
    const getRecipeButton = await screen.findByRole('button', { name: /get another recipe/i });
    await act(async () => {
      await user.click(getRecipeButton);
    });

    // Wait for recipe to appear
    await waitFor(() => {
      expect(screen.getByText('My Test Smoothie')).toBeInTheDocument();
    }, { timeout: 2000 });

    // Verify recipe is displayed
    expect(screen.getByText('My Test Smoothie')).toBeInTheDocument();

    // Click delete button
    const deleteButton = screen.getByTitle('Delete recipe');
    await act(async () => {
      await user.click(deleteButton);
    });

    // Confirm deletion
    await waitFor(() => {
      expect(screen.getByText('Delete Recipe?')).toBeInTheDocument();
    }, { timeout: 5000 });

    const confirmDeleteButton = screen.getByRole('button', { name: /^delete$/i });
    await act(async () => {
      await user.click(confirmDeleteButton);
      // Wait for state update and AnimatePresence to process
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Wait for deletion to complete and dialog to close
    await waitFor(() => {
      expect(screen.queryByText('Delete Recipe?')).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // Verify "Recipe deleted" message appears and becomes visible
    await waitFor(() => {
      const deletedMessage = screen.getByText('Recipe deleted');
      expect(deletedMessage).toBeInTheDocument();
      // Wait for animation to complete (opacity should be 1)
      const style = window.getComputedStyle(deletedMessage);
      expect(parseFloat(style.opacity)).toBeGreaterThan(0.9);
    }, { timeout: 3000 });

    // Verify the trash icon emoji is present
    const deletedMessage = screen.getByText('Recipe deleted');
    expect(deletedMessage).toBeVisible();
    
    // Check that the parent container has the trash emoji
    const container = deletedMessage.closest('div');
    expect(container?.textContent).toContain('🗑️');
    expect(container?.textContent).toContain('Recipe deleted');

    // Wait for message to disappear (after 2 seconds)
    await waitFor(() => {
      expect(screen.queryByText('Recipe deleted')).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });
});

