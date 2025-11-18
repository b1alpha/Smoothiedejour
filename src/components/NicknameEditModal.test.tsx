import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Session } from '@jsr/supabase__supabase-js';
import { NicknameEditModal } from './NicknameEditModal';
import { AuthProvider } from '../contexts/AuthContext';

describe('NicknameEditModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper to render modal with AuthProvider
  const renderModal = (props: { isOpen: boolean; onClose: typeof mockOnClose }) => {
    let result: ReturnType<typeof render>;
    act(() => {
      result = render(
        <AuthProvider>
          <NicknameEditModal {...props} />
        </AuthProvider>
      );
    });
    return result!;
  };

  it('should not render when isOpen is false', () => {
    renderModal({
      isOpen: false,
      onClose: mockOnClose,
    });

    expect(screen.queryByText('Edit Nickname')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', async () => {
    // Mock authenticated session
    const { supabase } = await import('../utils/supabase/client');
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: { id: 'test-user', email: 'test@example.com', user_metadata: { nickname: 'TestUser' } },
        } as unknown as Session,
      },
      error: null,
    });

    renderModal({
      isOpen: true,
      onClose: mockOnClose,
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Edit Nickname' })).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should display current nickname from context', async () => {
    const { supabase } = await import('../utils/supabase/client');
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: { id: 'test-user', email: 'test@example.com', user_metadata: { nickname: 'CurrentNickname' } },
        } as unknown as Session,
      },
      error: null,
    });

    renderModal({
      isOpen: true,
      onClose: mockOnClose,
    });

    await waitFor(() => {
      const nicknameInput = screen.getByLabelText(/nickname/i) as HTMLInputElement;
      expect(nicknameInput.value).toBe('CurrentNickname');
    }, { timeout: 3000 });
  });

  it('should initialize with empty string when no nickname exists', async () => {
    const { supabase } = await import('../utils/supabase/client');
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: { id: 'test-user', email: 'test@example.com', user_metadata: {} },
        } as unknown as Session,
      },
      error: null,
    });

    renderModal({
      isOpen: true,
      onClose: mockOnClose,
    });

    await waitFor(() => {
      const nicknameInput = screen.getByLabelText(/nickname/i) as HTMLInputElement;
      expect(nicknameInput.value).toBe('');
    }, { timeout: 3000 });
  });

  it('should update nickname input value when user types', async () => {
    const user = userEvent.setup();
    const { supabase } = await import('../utils/supabase/client');
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: { id: 'test-user', email: 'test@example.com', user_metadata: { nickname: 'OldNickname' } },
        } as unknown as Session,
      },
      error: null,
    });

    renderModal({
      isOpen: true,
      onClose: mockOnClose,
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/nickname/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    const nicknameInput = screen.getByLabelText(/nickname/i) as HTMLInputElement;
    await user.clear(nicknameInput);
    await user.type(nicknameInput, 'NewNickname');

    expect(nicknameInput.value).toBe('NewNickname');
  });

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const { supabase } = await import('../utils/supabase/client');
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: { id: 'test-user', email: 'test@example.com', user_metadata: {} },
        } as unknown as Session,
      },
      error: null,
    });

    renderModal({
      isOpen: true,
      onClose: mockOnClose,
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Close')).toBeInTheDocument();
    }, { timeout: 3000 });

    const closeButton = screen.getByLabelText('Close');
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const { supabase } = await import('../utils/supabase/client');
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: { id: 'test-user', email: 'test@example.com', user_metadata: {} },
        } as unknown as Session,
      },
      error: null,
    });

    renderModal({
      isOpen: true,
      onClose: mockOnClose,
    });

    await waitFor(() => {
      expect(screen.getByText('Edit Nickname')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Click on backdrop
    const backdrop = document.querySelector('.backdrop-blur-sm');
    if (backdrop) {
      await user.click(backdrop);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    }
  });

  it('should successfully update nickname', async () => {
    const user = userEvent.setup();
    const { supabase } = await import('../utils/supabase/client');
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: { id: 'test-user', email: 'test@example.com', user_metadata: { nickname: 'OldNickname' } },
        } as unknown as Session,
      },
      error: null,
    });

    vi.mocked(supabase.auth.updateUser).mockResolvedValue({
      data: {
        user: { id: 'test-user', email: 'test@example.com', user_metadata: { nickname: 'NewNickname' } },
      },
      error: null,
    });

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: {
        user: { id: 'test-user', email: 'test@example.com', user_metadata: { nickname: 'NewNickname' } },
      },
      error: null,
    });

    renderModal({
      isOpen: true,
      onClose: mockOnClose,
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/nickname/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    const nicknameInput = screen.getByLabelText(/nickname/i);
    const submitButton = screen.getByRole('button', { name: /save nickname/i });

    await user.clear(nicknameInput);
    await user.type(nicknameInput, 'NewNickname');
    await user.click(submitButton);

    await waitFor(() => {
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        data: {
          nickname: 'NewNickname',
        },
      });
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('should show error when nickname is empty', async () => {
    const user = userEvent.setup();
    const { supabase } = await import('../utils/supabase/client');
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: { id: 'test-user', email: 'test@example.com', user_metadata: {} },
        } as unknown as Session,
      },
      error: null,
    });

    renderModal({
      isOpen: true,
      onClose: mockOnClose,
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/nickname/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    const nicknameInput = screen.getByLabelText(/nickname/i) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /save nickname/i });

    // Use whitespace to bypass HTML5 validation but trigger component validation
    await user.clear(nicknameInput);
    await user.type(nicknameInput, '   ');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Nickname cannot be empty')).toBeInTheDocument();
      expect(supabase.auth.updateUser).not.toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('should show error when nickname is too short', async () => {
    const user = userEvent.setup();
    const { supabase } = await import('../utils/supabase/client');
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: { id: 'test-user', email: 'test@example.com', user_metadata: {} },
        } as unknown as Session,
      },
      error: null,
    });

    renderModal({
      isOpen: true,
      onClose: mockOnClose,
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/nickname/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    const nicknameInput = screen.getByLabelText(/nickname/i) as HTMLInputElement;

    await user.clear(nicknameInput);
    await user.type(nicknameInput, 'A');
    // Remove required attribute to bypass HTML5 validation
    nicknameInput.removeAttribute('required');
    nicknameInput.removeAttribute('minlength');
    // Submit form directly to bypass HTML5 validation
    const form = nicknameInput.closest('form');
    if (form) {
      fireEvent.submit(form);
    }

    await waitFor(() => {
      expect(screen.getByText('Nickname must be at least 2 characters')).toBeInTheDocument();
      expect(supabase.auth.updateUser).not.toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('should show error when nickname is too long', async () => {
    const user = userEvent.setup();
    const { supabase } = await import('../utils/supabase/client');
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: { id: 'test-user', email: 'test@example.com', user_metadata: {} },
        } as unknown as Session,
      },
      error: null,
    });

    renderModal({
      isOpen: true,
      onClose: mockOnClose,
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/nickname/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    const nicknameInput = screen.getByLabelText(/nickname/i) as HTMLInputElement;

    // Remove maxlength attribute before typing to allow 31 characters
    nicknameInput.removeAttribute('maxlength');
    await user.clear(nicknameInput);
    // Set value directly since HTML5 maxlength would prevent typing 31 chars
    fireEvent.change(nicknameInput, { target: { value: 'A'.repeat(31) } });
    // Submit form directly to bypass HTML5 validation
    const form = nicknameInput.closest('form');
    if (form) {
      fireEvent.submit(form);
    }

    await waitFor(() => {
      expect(screen.getByText('Nickname must be 30 characters or less')).toBeInTheDocument();
      expect(supabase.auth.updateUser).not.toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('should trim whitespace from nickname before submission', async () => {
    const user = userEvent.setup();
    const { supabase } = await import('../utils/supabase/client');
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: { id: 'test-user', email: 'test@example.com', user_metadata: {} },
        } as unknown as Session,
      },
      error: null,
    });

    vi.mocked(supabase.auth.updateUser).mockResolvedValue({
      data: {
        user: { id: 'test-user', email: 'test@example.com', user_metadata: { nickname: 'TrimmedNickname' } },
      },
      error: null,
    });

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: {
        user: { id: 'test-user', email: 'test@example.com', user_metadata: { nickname: 'TrimmedNickname' } },
      },
      error: null,
    });

    renderModal({
      isOpen: true,
      onClose: mockOnClose,
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/nickname/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    const nicknameInput = screen.getByLabelText(/nickname/i);
    const submitButton = screen.getByRole('button', { name: /save nickname/i });

    await user.clear(nicknameInput);
    await user.type(nicknameInput, '  TrimmedNickname  ');
    await user.click(submitButton);

    await waitFor(() => {
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        data: {
          nickname: 'TrimmedNickname',
        },
      });
    });
  });

  it('should display error message on update failure', async () => {
    const user = userEvent.setup();
    const { supabase } = await import('../utils/supabase/client');
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: { id: 'test-user', email: 'test@example.com', user_metadata: {} },
        } as unknown as Session,
      },
      error: null,
    });

    vi.mocked(supabase.auth.updateUser).mockResolvedValue({
      data: { user: null },
      error: { message: 'Update failed', name: 'AuthError', status: 400 },
    });

    renderModal({
      isOpen: true,
      onClose: mockOnClose,
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/nickname/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    const nicknameInput = screen.getByLabelText(/nickname/i);
    const submitButton = screen.getByRole('button', { name: /save nickname/i });

    await user.clear(nicknameInput);
    await user.type(nicknameInput, 'NewNickname');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Update failed')).toBeInTheDocument();
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  it('should show loading state during submission', async () => {
    const user = userEvent.setup();
    const { supabase } = await import('../utils/supabase/client');
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: { id: 'test-user', email: 'test@example.com', user_metadata: {} },
        } as unknown as Session,
      },
      error: null,
    });

    // Create a promise that we can control
    let resolvePromise: (value: { data: { user: { id: string; email: string; user_metadata: Record<string, unknown> } | null }; error: { message: string; name: string; status: number } | null }) => void;
    const controlledPromise = new Promise<{ data: { user: { id: string; email: string; user_metadata: Record<string, unknown> } | null }; error: { message: string; name: string; status: number } | null }>((resolve) => {
      resolvePromise = resolve;
    });

    vi.mocked(supabase.auth.updateUser).mockReturnValue(controlledPromise);

    renderModal({
      isOpen: true,
      onClose: mockOnClose,
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/nickname/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    const nicknameInput = screen.getByLabelText(/nickname/i);
    const submitButton = screen.getByRole('button', { name: /save nickname/i });

    await user.clear(nicknameInput);
    await user.type(nicknameInput, 'NewNickname');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    // Resolve the promise
    resolvePromise!({
      data: {
        user: { id: 'test-user', email: 'test@example.com', user_metadata: { nickname: 'NewNickname' } },
      },
      error: null,
    });

    await waitFor(() => {
      expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
    });
  });

  it('should reset error when modal opens', async () => {
    const user = userEvent.setup();
    const { supabase } = await import('../utils/supabase/client');
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: { id: 'test-user', email: 'test@example.com', user_metadata: {} },
        } as unknown as Session,
      },
      error: null,
    });

    vi.mocked(supabase.auth.updateUser).mockResolvedValue({
      data: { user: null },
      error: { message: 'Update failed', name: 'AuthError', status: 400 },
    });

    const { rerender } = renderModal({
      isOpen: true,
      onClose: mockOnClose,
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/nickname/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    const nicknameInput = screen.getByLabelText(/nickname/i);
    const submitButton = screen.getByRole('button', { name: /save nickname/i });

    await user.clear(nicknameInput);
    await user.type(nicknameInput, 'NewNickname');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Update failed')).toBeInTheDocument();
    });

    // Close and reopen modal
    rerender(
      <AuthProvider>
        <NicknameEditModal isOpen={false} onClose={mockOnClose} />
      </AuthProvider>
    );

    rerender(
      <AuthProvider>
        <NicknameEditModal isOpen={true} onClose={mockOnClose} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('Update failed')).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should initialize nickname input from context when modal opens', async () => {
    const { supabase } = await import('../utils/supabase/client');
    
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: { id: 'test-user', email: 'test@example.com', user_metadata: { nickname: 'ContextNickname' } },
        } as unknown as Session,
      },
      error: null,
    });

    renderModal({
      isOpen: true,
      onClose: mockOnClose,
    });

    await waitFor(() => {
      const nicknameInput = screen.getByLabelText(/nickname/i) as HTMLInputElement;
      expect(nicknameInput.value).toBe('ContextNickname');
    }, { timeout: 3000 });
  });
});

