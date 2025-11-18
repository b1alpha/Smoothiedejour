import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContributeRecipeModal } from './ContributeRecipeModal';
import { AuthProvider } from '../contexts/AuthContext';

describe('ContributeRecipeModal Validation', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderModal = (props: { isOpen: boolean; onClose: typeof mockOnClose; onSubmit: typeof mockOnSubmit }) => {
    return render(
      <AuthProvider>
        <ContributeRecipeModal {...props} />
      </AuthProvider>
    );
  };

  it('should show error when recipe name is empty', async () => {
    const user = userEvent.setup();
    renderModal({
      isOpen: true,
      onClose: mockOnClose,
      onSubmit: mockOnSubmit,
    });

    await waitFor(() => {
      expect(screen.getByText('Contribute a Recipe')).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/recipe name/i);
    // Clear any existing value and blur to trigger validation
    await user.clear(nameInput);
    await user.tab(); // Blur the field

    await waitFor(() => {
      expect(screen.getByText(/recipe name is required/i)).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('should show error when recipe name is too long', async () => {
    const user = userEvent.setup();
    renderModal({
      isOpen: true,
      onClose: mockOnClose,
      onSubmit: mockOnSubmit,
    });

    await waitFor(() => {
      expect(screen.getByText('Contribute a Recipe')).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/recipe name/i);
    const longName = 'a'.repeat(101);
    await user.type(nameInput, longName);
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/recipe name must be 100 characters or less/i)).toBeInTheDocument();
    });
  });

  it('should show error when contributor name is empty', async () => {
    const user = userEvent.setup();
    renderModal({
      isOpen: true,
      onClose: mockOnClose,
      onSubmit: mockOnSubmit,
    });

    await waitFor(() => {
      expect(screen.getByText('Contribute a Recipe')).toBeInTheDocument();
    });

    const contributorInput = screen.getByLabelText(/your name/i);
    await user.clear(contributorInput);
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/contributor name is required/i)).toBeInTheDocument();
    });
  });

  it('should show error when instructions are too short', async () => {
    const user = userEvent.setup();
    renderModal({
      isOpen: true,
      onClose: mockOnClose,
      onSubmit: mockOnSubmit,
    });

    await waitFor(() => {
      expect(screen.getByText('Contribute a Recipe')).toBeInTheDocument();
    });

    const instructionsInput = screen.getByLabelText(/instructions/i);
    await user.type(instructionsInput, 'Short');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/instructions must be at least 10 characters/i)).toBeInTheDocument();
    });
  });

  it('should show error when instructions are too long', async () => {
    const user = userEvent.setup();
    renderModal({
      isOpen: true,
      onClose: mockOnClose,
      onSubmit: mockOnSubmit,
    });

    await waitFor(() => {
      expect(screen.getByText('Contribute a Recipe')).toBeInTheDocument();
    });

    const instructionsInput = screen.getByLabelText(/instructions/i);
    const longInstructions = 'a'.repeat(2001);
    await user.type(instructionsInput, longInstructions);
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/instructions must be 2000 characters or less/i)).toBeInTheDocument();
    });
  });

  it('should show error when servings is invalid', async () => {
    const user = userEvent.setup();
    renderModal({
      isOpen: true,
      onClose: mockOnClose,
      onSubmit: mockOnSubmit,
    });

    await waitFor(() => {
      expect(screen.getByText('Contribute a Recipe')).toBeInTheDocument();
    });

    const servingsInput = screen.getByLabelText(/servings/i);
    await user.clear(servingsInput);
    await user.type(servingsInput, '0');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/servings must be a number between 1 and 100/i)).toBeInTheDocument();
    });
  });

  it('should show error when servings is greater than 100', async () => {
    const user = userEvent.setup();
    renderModal({
      isOpen: true,
      onClose: mockOnClose,
      onSubmit: mockOnSubmit,
    });

    await waitFor(() => {
      expect(screen.getByText('Contribute a Recipe')).toBeInTheDocument();
    });

    const servingsInput = screen.getByLabelText(/servings/i);
    await user.clear(servingsInput);
    await user.type(servingsInput, '101');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/servings must be a number between 1 and 100/i)).toBeInTheDocument();
    });
  });

  it('should show error when no ingredients are provided', async () => {
    const user = userEvent.setup();
    renderModal({
      isOpen: true,
      onClose: mockOnClose,
      onSubmit: mockOnSubmit,
    });

    await waitFor(() => {
      expect(screen.getByText('Contribute a Recipe')).toBeInTheDocument();
    });

    const ingredientInputs = screen.getAllByPlaceholderText(/e.g., 1 cup frozen mango/i);
    await user.click(ingredientInputs[0]);
    await user.tab();

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/at least one ingredient is required/i)).toBeInTheDocument();
    });
  });

  it('should show error when ingredient is empty', async () => {
    const user = userEvent.setup();
    renderModal({
      isOpen: true,
      onClose: mockOnClose,
      onSubmit: mockOnSubmit,
    });

    await waitFor(() => {
      expect(screen.getByText('Contribute a Recipe')).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /^add$/i });
    await user.click(addButton);

    await waitFor(() => {
      const ingredientInputs = screen.getAllByPlaceholderText(/e.g., 1 cup frozen mango/i);
      expect(ingredientInputs.length).toBeGreaterThan(1);
    });

    const ingredientInputs = screen.getAllByPlaceholderText(/e.g., 1 cup frozen mango/i);
    await user.clear(ingredientInputs[0]);
    await user.type(ingredientInputs[0], '1 banana');
    await user.clear(ingredientInputs[1]);
    await user.type(ingredientInputs[1], '   '); // Only whitespace
    
    // Fill other required fields so we can submit
    await user.type(screen.getByLabelText(/recipe name/i), 'Test Recipe');
    await user.type(screen.getByLabelText(/instructions/i), 'Blend everything together until smooth');
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    await waitFor(() => {
      // Check if error appears - whitespace-only ingredients get trimmed and fail validation
      // The error might be on the ingredient array or individual ingredient
      const errorSummary = screen.queryByTestId('error-summary');
      const hasError = errorSummary?.textContent?.match(/all ingredients must have content/i) ||
                      errorSummary?.textContent?.match(/ingredient cannot be empty/i) ||
                      errorSummary?.textContent?.match(/at least one ingredient is required/i) ||
                      errorSummary?.textContent?.match(/ingredients/i);
      // Also check for inline error message
      const inlineError = screen.queryByText(/all ingredients must have content/i) ||
                         screen.queryByText(/ingredient cannot be empty/i) ||
                         screen.queryByText(/at least one ingredient is required/i);
      expect(hasError || inlineError).toBeTruthy();
    }, { timeout: 5000 });
  });

  it('should not submit form when validation fails', async () => {
    const user = userEvent.setup();
    renderModal({
      isOpen: true,
      onClose: mockOnClose,
      onSubmit: mockOnSubmit,
    });

    await waitFor(() => {
      expect(screen.getByText('Contribute a Recipe')).toBeInTheDocument();
    });

    // Try to submit without filling required fields
    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    // Should show validation errors (check error summary or inline error)
    await waitFor(() => {
      const errorSummary = screen.queryByTestId('error-summary');
      const hasError = errorSummary?.textContent?.match(/recipe name is required/i) ||
                      screen.queryByText(/recipe name is required/i);
      expect(hasError).toBeTruthy();
    }, { timeout: 3000 });

    // Should not call onSubmit
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should clear errors when field is corrected', async () => {
    const user = userEvent.setup();
    renderModal({
      isOpen: true,
      onClose: mockOnClose,
      onSubmit: mockOnSubmit,
    });

    await waitFor(() => {
      expect(screen.getByText('Contribute a Recipe')).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/recipe name/i);
    await user.click(nameInput);
    await user.tab(); // Blur to trigger validation

    await waitFor(() => {
      expect(screen.getByText(/recipe name is required/i)).toBeInTheDocument();
    });

    // Fix the error
    await user.type(nameInput, 'Valid Recipe Name');
    await user.tab();

    await waitFor(() => {
      expect(screen.queryByText(/recipe name is required/i)).not.toBeInTheDocument();
    });
  });

  it('should validate all fields on submit', async () => {
    const user = userEvent.setup();
    renderModal({
      isOpen: true,
      onClose: mockOnClose,
      onSubmit: mockOnSubmit,
    });

    await waitFor(() => {
      expect(screen.getByText('Contribute a Recipe')).toBeInTheDocument();
    });

    // Submit empty form
    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    // Should show multiple validation errors
    await waitFor(() => {
      const errorSummary = screen.queryByTestId('error-summary');
      expect(errorSummary).toBeInTheDocument();
      expect(errorSummary?.textContent).toMatch(/recipe name/i);
      expect(errorSummary?.textContent).toMatch(/instructions/i);
      expect(errorSummary?.textContent).toMatch(/ingredients/i);
    }, { timeout: 3000 });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should submit successfully when all validations pass', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockResolvedValue(true);

    renderModal({
      isOpen: true,
      onClose: mockOnClose,
      onSubmit: mockOnSubmit,
    });

    await waitFor(() => {
      expect(screen.getByText('Contribute a Recipe')).toBeInTheDocument();
    });

    // Fill in all required fields with valid data
    await user.type(screen.getByLabelText(/recipe name/i), 'Test Smoothie');
    await user.type(screen.getByLabelText(/your name/i), 'Test User');
    
    const ingredientInputs = screen.getAllByPlaceholderText(/e.g., 1 cup frozen mango/i);
    await user.clear(ingredientInputs[0]);
    await user.type(ingredientInputs[0], '1 banana');
    
    await user.type(screen.getByLabelText(/instructions/i), 'Blend everything together until smooth');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });

    // Should not show any errors
    expect(screen.queryByText(/required/i)).not.toBeInTheDocument();
  });
});

