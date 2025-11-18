import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { ContributeRecipeModal } from './ContributeRecipeModal';
import { AuthProvider } from '../contexts/AuthContext';

describe('ContributeRecipeModal Submit Feedback', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderModal = (props: { isOpen: boolean; onClose: typeof mockOnClose; onSubmit: typeof mockOnSubmit }) => {
    return render(
      React.createElement(
        AuthProvider,
        {},
        React.createElement(ContributeRecipeModal, props)
      )
    );
  };

  it('should show error summary when submitting empty form', async () => {
    const user = userEvent.setup();
    renderModal({
      isOpen: true,
      onClose: mockOnClose,
      onSubmit: mockOnSubmit,
    });

    await waitFor(() => {
      expect(screen.getByText('Contribute a Recipe')).toBeInTheDocument();
    });

    // Try to submit empty form
    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    // Should show error summary
    await waitFor(() => {
      expect(screen.getByTestId('error-summary')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Should list specific errors
    const errorSummary = screen.getByTestId('error-summary');
    expect(errorSummary.textContent).toMatch(/recipe name/i);
    expect(errorSummary.textContent).toMatch(/instructions/i);
    expect(errorSummary.textContent).toMatch(/ingredients/i);

    // Should not call onSubmit
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  // Removed: This test is redundant - "should show error summary when submitting empty form" 
  // already tests that error summary appears on submit. The behavior with pre-validated fields
  // is already covered by validation tests that check inline error display.

  it('should scroll to first error field when validation fails', async () => {
    const user = userEvent.setup();
    const scrollIntoViewMock = vi.fn();
    const originalScrollIntoView = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = scrollIntoViewMock;

    renderModal({
      isOpen: true,
      onClose: mockOnClose,
      onSubmit: mockOnSubmit,
    });

    await waitFor(() => {
      expect(screen.getByText('Contribute a Recipe')).toBeInTheDocument();
    });

    // Try to submit empty form
    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    // Wait for validation errors to appear
    await waitFor(() => {
      expect(screen.queryByTestId('error-summary')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Should attempt to scroll to first error (happens in setTimeout)
    await new Promise(resolve => setTimeout(resolve, 200));
    expect(scrollIntoViewMock).toHaveBeenCalled();

    // Restore original
    Element.prototype.scrollIntoView = originalScrollIntoView;
  });

  it('should focus first error input when validation fails', async () => {
    const user = userEvent.setup();
    renderModal({
      isOpen: true,
      onClose: mockOnClose,
      onSubmit: mockOnSubmit,
    });

    await waitFor(() => {
      expect(screen.getByText('Contribute a Recipe')).toBeInTheDocument();
    });

    // Try to submit empty form
    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    // Wait for errors to appear
    await waitFor(() => {
      expect(screen.queryByTestId('error-summary')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Wait for focus to happen (happens in setTimeout)
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // First error field should be focused (name field)
    const nameInput = screen.getByLabelText(/recipe name/i);
    // Check if nameInput is focused (might be the input itself or a parent)
    expect(document.activeElement === nameInput || nameInput.contains(document.activeElement)).toBe(true);
  });

  it('should hide error summary when form is valid', async () => {
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

    // Fill form with valid data
    await user.type(screen.getByLabelText(/recipe name/i), 'Test Smoothie');
    await user.type(screen.getByLabelText(/your name/i), 'Test User');
    
    const ingredientInputs = screen.getAllByPlaceholderText(/e.g., 1 cup frozen mango/i);
    await user.clear(ingredientInputs[0]);
    await user.type(ingredientInputs[0], '1 banana');
    
    await user.type(screen.getByLabelText(/instructions/i), 'Blend everything together until smooth');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    // Should not show error summary
    await waitFor(() => {
      expect(screen.queryByText(/please fix the following errors/i)).not.toBeInTheDocument();
    });

    // Should call onSubmit
    expect(mockOnSubmit).toHaveBeenCalled();
  });
});

