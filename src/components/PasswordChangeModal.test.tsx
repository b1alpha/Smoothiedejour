import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PasswordChangeModal } from './PasswordChangeModal';
import { AuthProvider } from '../contexts/AuthContext';

describe('PasswordChangeModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper to render modal with AuthProvider
  const renderModal = (props: { isOpen: boolean; onClose: typeof mockOnClose }) => {
    return render(
      <AuthProvider>
        <PasswordChangeModal {...props} />
      </AuthProvider>
    );
  };

  it('should not render when isOpen is false', () => {
    renderModal({
      isOpen: false,
      onClose: mockOnClose,
    });

    expect(screen.queryByText('Change Password')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', async () => {
    // Mock authenticated session
    const { supabase } = await import('../utils/supabase/client');
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: { id: 'test-user', email: 'test@example.com' },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      },
      error: null,
    });

    renderModal({
      isOpen: true,
      onClose: mockOnClose,
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Change Password' })).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should allow user to change password', async () => {
    const user = userEvent.setup();
    
    // Mock authenticated session BEFORE rendering
    const { supabase } = await import('../utils/supabase/client');
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: { id: 'test-user', email: 'test@example.com' },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      },
      error: null,
    });

    vi.mocked(supabase.auth.updateUser).mockResolvedValue({
      data: { user: { id: 'test-user', email: 'test@example.com' } },
      error: null,
    });

    renderModal({
      isOpen: true,
      onClose: mockOnClose,
    });

    // Wait for modal to render (auth context needs to load first)
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Change Password' })).toBeInTheDocument();
    }, { timeout: 3000 });

    // Fill in new password
    const newPasswordInputs = screen.getAllByLabelText(/new password/i);
    await user.type(newPasswordInputs[0], 'newpassword123');

    // Fill in confirm password
    const confirmPasswordInputs = screen.getAllByLabelText(/confirm new password/i);
    await user.type(confirmPasswordInputs[0], 'newpassword123');

    // Submit
    const submitButton = screen.getByRole('button', { name: /change password/i });
    await user.click(submitButton);

    // Verify updateUser was called with new password
    await waitFor(() => {
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'newpassword123',
      });
    });

    // Verify modal closes on success
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('should show error when passwords do not match', async () => {
    const user = userEvent.setup();
    
    // Mock authenticated session BEFORE rendering
    const { supabase } = await import('../utils/supabase/client');
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: { id: 'test-user', email: 'test@example.com' },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      },
      error: null,
    });

    renderModal({
      isOpen: true,
      onClose: mockOnClose,
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Change Password' })).toBeInTheDocument();
    }, { timeout: 3000 });

    // Fill in mismatched passwords
    const newPasswordInputs = screen.getAllByLabelText(/new password/i);
    await user.type(newPasswordInputs[0], 'newpassword123');

    const confirmPasswordInputs = screen.getAllByLabelText(/confirm new password/i);
    await user.type(confirmPasswordInputs[0], 'differentpassword');

    // Submit
    const submitButton = screen.getByRole('button', { name: /change password/i });
    await user.click(submitButton);

    // Verify error message
    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });

    // Verify modal does not close
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should show error when password is too short', async () => {
    const user = userEvent.setup();
    
    // Mock authenticated session BEFORE rendering
    const { supabase } = await import('../utils/supabase/client');
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: { id: 'test-user', email: 'test@example.com' },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      },
      error: null,
    });

    renderModal({
      isOpen: true,
      onClose: mockOnClose,
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Change Password' })).toBeInTheDocument();
    }, { timeout: 3000 });

    // Fill in short password (HTML5 validation will prevent submission, so we need to bypass it)
    const newPasswordInputs = screen.getAllByLabelText(/new password/i);
    const newPasswordInput = newPasswordInputs[0] as HTMLInputElement;
    await user.clear(newPasswordInput);
    await user.type(newPasswordInput, '12345');

    const confirmPasswordInputs = screen.getAllByLabelText(/confirm new password/i);
    const confirmPasswordInput = confirmPasswordInputs[0] as HTMLInputElement;
    await user.clear(confirmPasswordInput);
    await user.type(confirmPasswordInput, '12345');

    // Remove minLength to bypass HTML5 validation
    newPasswordInput.removeAttribute('minLength');
    confirmPasswordInput.removeAttribute('minLength');

    // Submit
    const submitButton = screen.getByRole('button', { name: /change password/i });
    await user.click(submitButton);

    // Verify error message
    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters long')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Verify modal does not close
    expect(mockOnClose).not.toHaveBeenCalled();
  });
});

