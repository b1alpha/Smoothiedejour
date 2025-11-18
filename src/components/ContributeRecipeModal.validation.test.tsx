import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContributeRecipeModal } from './ContributeRecipeModal';
import { AuthProvider } from '../contexts/AuthContext';

describe('ContributeRecipeModal Validation (UI Integration)', () => {
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

  // Helper to wait for modal to be ready
  const waitForModal = async () => {
    await waitFor(() => {
      expect(screen.getByText('Contribute a Recipe')).toBeInTheDocument();
    });
  };

  // Helper to fill valid form
  const fillValidForm = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.type(screen.getByLabelText(/recipe name/i), 'Test Smoothie');
    await user.type(screen.getByLabelText(/your name/i), 'Test User');
    
    const ingredientInputs = screen.getAllByPlaceholderText(/e.g., 1 cup frozen mango/i);
    await user.clear(ingredientInputs[0]);
    await user.type(ingredientInputs[0], '1 banana');
    
    await user.type(screen.getByLabelText(/instructions/i), 'Blend everything together until smooth');
  };

  it('should show error summary when submitting empty form', async () => {
    const user = userEvent.setup();
    renderModal({
      isOpen: true,
      onClose: mockOnClose,
      onSubmit: mockOnSubmit,
    });

    await waitForModal();

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    await waitFor(() => {
      const errorSummary = screen.getByTestId('error-summary');
      expect(errorSummary).toBeInTheDocument();
      expect(errorSummary.textContent).toMatch(/recipe name/i);
      expect(errorSummary.textContent).toMatch(/instructions/i);
      expect(errorSummary.textContent).toMatch(/ingredients/i);
    }, { timeout: 3000 });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should show inline error when field is invalid and blurred', async () => {
    const user = userEvent.setup();
    renderModal({
      isOpen: true,
      onClose: mockOnClose,
      onSubmit: mockOnSubmit,
    });

    await waitForModal();

    const nameInput = screen.getByLabelText(/recipe name/i);
    await user.clear(nameInput);
    await user.tab(); // Blur to trigger validation

    await waitFor(() => {
      expect(screen.getByText(/recipe name is required/i)).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('should clear error when field is corrected', async () => {
    const user = userEvent.setup();
    renderModal({
      isOpen: true,
      onClose: mockOnClose,
      onSubmit: mockOnSubmit,
    });

    await waitForModal();

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

  it('should submit successfully when all validations pass', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockResolvedValue(true);

    renderModal({
      isOpen: true,
      onClose: mockOnClose,
      onSubmit: mockOnSubmit,
    });

    await waitForModal();
    await fillValidForm(user);

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });

    // Should not show any errors
    expect(screen.queryByText(/required/i)).not.toBeInTheDocument();
  });

  it('should not submit form when validation fails', async () => {
    const user = userEvent.setup();
    renderModal({
      isOpen: true,
      onClose: mockOnClose,
      onSubmit: mockOnSubmit,
    });

    await waitForModal();

    // Try to submit without filling required fields
    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    // Should show validation errors
    await waitFor(() => {
      const errorSummary = screen.queryByTestId('error-summary');
      const hasError = errorSummary?.textContent?.match(/recipe name is required/i) ||
                      screen.queryByText(/recipe name is required/i);
      expect(hasError).toBeTruthy();
    }, { timeout: 3000 });

    // Should not call onSubmit
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});
