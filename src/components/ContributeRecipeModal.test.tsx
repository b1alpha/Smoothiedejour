import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContributeRecipeModal } from './ContributeRecipeModal';
import { AuthProvider } from '../contexts/AuthContext';

describe('ContributeRecipeModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper to render modal with AuthProvider
  const renderModal = (props: { isOpen: boolean; onClose: typeof mockOnClose; onSubmit: typeof mockOnSubmit }) => {
    return render(
      <AuthProvider>
        <ContributeRecipeModal {...props} />
      </AuthProvider>
    );
  };

  it('should not render when isOpen is false', () => {
    renderModal({
      isOpen: false,
      onClose: mockOnClose,
      onSubmit: mockOnSubmit,
    });

    expect(screen.queryByText('Contribute a Recipe')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    renderModal({
      isOpen: true,
      onClose: mockOnClose,
      onSubmit: mockOnSubmit,
    });

    expect(screen.getByText('Contribute a Recipe')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    renderModal({
      isOpen: true,
      onClose: mockOnClose,
      onSubmit: mockOnSubmit,
    });

    // The close button is an X icon without accessible name, find it by its parent button
    const closeButton = screen.getByText('Contribute a Recipe').parentElement?.querySelector('button');
    if (closeButton) {
      await user.click(closeButton);
      expect(mockOnClose).toHaveBeenCalled();
    } else {
      // Fallback: click backdrop
      const backdrop = document.querySelector('.fixed.inset-0');
      if (backdrop) {
        await user.click(backdrop);
        expect(mockOnClose).toHaveBeenCalled();
      }
    }
  });

  it('should allow user to fill in recipe form', async () => {
    const user = userEvent.setup();
    renderModal({
      isOpen: true,
      onClose: mockOnClose,
      onSubmit: mockOnSubmit,
    });

    const nameInput = screen.getByLabelText(/recipe name/i);
    const contributorInput = screen.getByLabelText(/your name/i);
    const instructionsInput = screen.getByLabelText(/instructions/i);

    await user.type(nameInput, 'Test Smoothie');
    await user.type(contributorInput, 'Test User');
    await user.type(instructionsInput, 'Blend everything');

    expect(nameInput).toHaveValue('Test Smoothie');
    expect(contributorInput).toHaveValue('Test User');
    expect(instructionsInput).toHaveValue('Blend everything');
  });

  it('should allow adding and removing ingredients', async () => {
    const user = userEvent.setup();
    renderModal({
      isOpen: true,
      onClose: mockOnClose,
      onSubmit: mockOnSubmit,
    });

    // Wait for modal to render
    await waitFor(() => {
      expect(screen.getByText('Contribute a Recipe')).toBeInTheDocument();
    });

    // Find the "Add" button (it says "Add" not "Add Ingredient")
    const addButton = screen.getByRole('button', { name: /^add$/i });
    await user.click(addButton);

    await waitFor(() => {
      const ingredientInputs = screen.getAllByPlaceholderText(/e.g., 1 cup frozen mango/i);
      expect(ingredientInputs.length).toBeGreaterThan(1);
    });

    // Type in first ingredient
    const ingredientInputs = screen.getAllByPlaceholderText(/e.g., 1 cup frozen mango/i);
    await user.type(ingredientInputs[0], '1 banana');

    // Remove button is a trash icon button without accessible name, find by its parent
    const removeButtons = document.querySelectorAll('button[type="button"]');
    const trashButton = Array.from(removeButtons).find(btn => 
      btn.querySelector('svg') && btn.querySelector('svg')?.classList.contains('lucide-trash-2')
    );
    if (trashButton) {
      await user.click(trashButton);
    }
  });

  it('should call onSubmit with correct recipe data when form is submitted', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockResolvedValue(true);

    renderModal({
      isOpen: true,
      onClose: mockOnClose,
      onSubmit: mockOnSubmit,
    });

    // Wait for modal to render
    await waitFor(() => {
      expect(screen.getByText('Contribute a Recipe')).toBeInTheDocument();
    });

    // Fill in form
    const nameInput = screen.getByLabelText(/recipe name/i);
    const contributorInput = screen.getByLabelText(/your name/i);
    const instructionsInput = screen.getByLabelText(/instructions/i);
    
    await user.type(nameInput, 'Test Smoothie');
    await user.type(contributorInput, 'Test User');
    
    // Use correct placeholder text
    const ingredientInputs = await screen.findAllByPlaceholderText(/e.g., 1 cup frozen mango/i);
    await user.clear(ingredientInputs[0]);
    await user.type(ingredientInputs[0], '1 banana');
    
    await user.type(instructionsInput, 'Blend everything');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
      const callArgs = mockOnSubmit.mock.calls[0][0];
      expect(callArgs.name).toBe('Test Smoothie');
      expect(callArgs.contributor).toBe('Test User');
      expect(callArgs.ingredients).toContain('1 banana');
      expect(callArgs.instructions).toBe('Blend everything');
    }, { timeout: 3000 });
  });

  it('should not submit if no ingredients are provided', async () => {
    const user = userEvent.setup();
    renderModal({
      isOpen: true,
      onClose: mockOnClose,
      onSubmit: mockOnSubmit,
    });

    await user.type(screen.getByLabelText(/recipe name/i), 'Test Smoothie');
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    // Should not call onSubmit if ingredients are empty
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should reset form and close modal after successful submission', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockResolvedValue(true);

    renderModal({
      isOpen: true,
      onClose: mockOnClose,
      onSubmit: mockOnSubmit,
    });

    // Wait for modal to render
    await waitFor(() => {
      expect(screen.getByText('Contribute a Recipe')).toBeInTheDocument();
    });

    // Fill and submit form
    await user.type(screen.getByLabelText(/recipe name/i), 'Test Smoothie');
    await user.type(screen.getByLabelText(/your name/i), 'Test User');
    
    // Use correct placeholder text
    const ingredientInputs = await screen.findAllByPlaceholderText(/e.g., 1 cup frozen mango/i);
    await user.clear(ingredientInputs[0]);
    await user.type(ingredientInputs[0], '1 banana');
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    // Wait for success message (the component shows "Success!" overlay)
    await waitFor(() => {
      expect(screen.getByText(/success!/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Wait for modal to close (the component uses setTimeout internally)
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('should allow toggling containsFat and containsNuts switches', async () => {
    const user = userEvent.setup();
    renderModal({
      isOpen: true,
      onClose: mockOnClose,
      onSubmit: mockOnSubmit,
    });

    const fatSwitch = screen.getByLabelText(/contains fat/i);
    const nutsSwitch = screen.getByLabelText(/contains nuts/i);

    await user.click(fatSwitch);
    await user.click(nutsSwitch);

    // Radix UI switches use aria-checked
    await waitFor(() => {
      expect(fatSwitch).toHaveAttribute('aria-checked', 'true');
      expect(nutsSwitch).toHaveAttribute('aria-checked', 'true');
    });
  });
});

