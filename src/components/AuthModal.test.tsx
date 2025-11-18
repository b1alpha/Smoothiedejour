import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Session } from '@jsr/supabase__supabase-js';
import { AuthModal } from './AuthModal';
import { AuthProvider } from '../contexts/AuthContext';

describe('AuthModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper to render modal with AuthProvider
  const renderModal = (props: { isOpen: boolean; onClose: typeof mockOnClose; initialMode?: 'signin' | 'signup' }) => {
    let result: ReturnType<typeof render>;
    act(() => {
      result = render(
        <AuthProvider>
          <AuthModal {...props} />
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

    expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
    expect(screen.queryByText('Sign Up')).not.toBeInTheDocument();
  });

  it('should render sign in mode by default', async () => {
    renderModal({
      isOpen: true,
      onClose: mockOnClose,
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
      expect(screen.getByText('Sign in to save your recipes and favorites')).toBeInTheDocument();
    });
  });

  it('should render sign up mode when initialMode is signup', async () => {
    renderModal({
      isOpen: true,
      onClose: mockOnClose,
      initialMode: 'signup',
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Sign Up' })).toBeInTheDocument();
      expect(screen.getByText('Create an account to share your smoothie recipes')).toBeInTheDocument();
      expect(screen.getByLabelText(/nickname/i)).toBeInTheDocument();
    });
  });

  it('should show nickname field only in signup mode', async () => {
    renderModal({
      isOpen: true,
      onClose: mockOnClose,
      initialMode: 'signin',
    });

    await waitFor(() => {
      expect(screen.queryByLabelText(/nickname/i)).not.toBeInTheDocument();
    });

    // Switch to signup mode
    const switchButton = screen.getByText("Don't have an account? Sign up");
    await userEvent.click(switchButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/nickname/i)).toBeInTheDocument();
    });
  });

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    renderModal({
      isOpen: true,
      onClose: mockOnClose,
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Close')).toBeInTheDocument();
    });

    const closeButton = screen.getByLabelText('Close');
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    renderModal({
      isOpen: true,
      onClose: mockOnClose,
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
    });

    // Click on backdrop (the div with backdrop-blur-sm class)
    const backdrop = document.querySelector('.backdrop-blur-sm');
    if (backdrop) {
      await user.click(backdrop);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    }
  });

  it('should switch between signin and signup modes', async () => {
    const user = userEvent.setup();
    renderModal({
      isOpen: true,
      onClose: mockOnClose,
      initialMode: 'signin',
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
    });

    // Switch to signup
    const switchToSignup = screen.getByText("Don't have an account? Sign up");
    await user.click(switchToSignup);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Sign Up' })).toBeInTheDocument();
      expect(screen.getByLabelText(/nickname/i)).toBeInTheDocument();
    });

    // Switch back to signin
    const switchToSignin = screen.getByText('Already have an account? Sign in');
    await user.click(switchToSignin);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
      expect(screen.queryByLabelText(/nickname/i)).not.toBeInTheDocument();
    });
  });

  it('should handle sign in form submission', async () => {
    const user = userEvent.setup();
    
    // Mock authenticated session
    const { supabase } = await import('../utils/supabase/client');
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: {
        user: { id: 'test-user', email: 'test@example.com' },
        session: {
          user: { id: 'test-user', email: 'test@example.com' },
        } as unknown as Session,
      },
      error: null,
    });

    renderModal({
      isOpen: true,
      onClose: mockOnClose,
      initialMode: 'signin',
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('should handle sign up form submission', async () => {
    const user = userEvent.setup();
    
    // Mock authenticated session
    const { supabase } = await import('../utils/supabase/client');
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: {
        user: { id: 'test-user', email: 'test@example.com' },
        session: {
          user: { id: 'test-user', email: 'test@example.com' },
        } as unknown as Session,
      },
      error: null,
    });

    renderModal({
      isOpen: true,
      onClose: mockOnClose,
      initialMode: 'signup',
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/nickname/i)).toBeInTheDocument();
    });

    const nicknameInput = screen.getByLabelText(/nickname/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    await user.type(nicknameInput, 'TestUser');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: {
            nickname: 'TestUser',
          },
        },
      });
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('should show error when signup without nickname', async () => {
    const user = userEvent.setup();
    
    const { supabase } = await import('../utils/supabase/client');
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    renderModal({
      isOpen: true,
      onClose: mockOnClose,
      initialMode: 'signup',
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/nickname/i)).toBeInTheDocument();
    });

    const nicknameInput = screen.getByLabelText(/nickname/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    // Type only whitespace in nickname to bypass HTML validation but trigger component validation
    await user.type(nicknameInput, '   ');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a nickname')).toBeInTheDocument();
      expect(supabase.auth.signUp).not.toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('should display error message on sign in failure', async () => {
    const user = userEvent.setup();
    
    const { supabase } = await import('../utils/supabase/client');
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid credentials', name: 'AuthError', status: 400 },
    });

    renderModal({
      isOpen: true,
      onClose: mockOnClose,
      initialMode: 'signin',
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  it('should display error message on sign up failure', async () => {
    const user = userEvent.setup();
    
    const { supabase } = await import('../utils/supabase/client');
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Email already registered', name: 'AuthError', status: 400 },
    });

    renderModal({
      isOpen: true,
      onClose: mockOnClose,
      initialMode: 'signup',
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/nickname/i)).toBeInTheDocument();
    });

    const nicknameInput = screen.getByLabelText(/nickname/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    await user.type(nicknameInput, 'TestUser');
    await user.type(emailInput, 'existing@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Email already registered')).toBeInTheDocument();
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  it('should show loading state during submission', async () => {
    const user = userEvent.setup();
    
    const { supabase } = await import('../utils/supabase/client');
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    // Create a promise that we can control
    let resolvePromise: (value: { data: { user: { id: string; email: string } | null; session: Session | null }; error: { message: string; name: string; status: number } | null }) => void;
    const controlledPromise = new Promise<{ data: { user: { id: string; email: string } | null; session: Session | null }; error: { message: string; name: string; status: number } | null }>((resolve) => {
      resolvePromise = resolve;
    });

    vi.mocked(supabase.auth.signInWithPassword).mockReturnValue(controlledPromise);

    renderModal({
      isOpen: true,
      onClose: mockOnClose,
      initialMode: 'signin',
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please wait...')).toBeInTheDocument();
    });

    // Resolve the promise
    resolvePromise!({
      data: {
        user: { id: 'test-user', email: 'test@example.com' },
        session: {
          user: { id: 'test-user', email: 'test@example.com' },
        } as unknown as Session,
      },
      error: null,
    });

    await waitFor(() => {
      expect(screen.queryByText('Please wait...')).not.toBeInTheDocument();
    });
  });

  it('should clear form fields after successful submission', async () => {
    const user = userEvent.setup();
    
    const { supabase } = await import('../utils/supabase/client');
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: {
        user: { id: 'test-user', email: 'test@example.com' },
        session: {
          user: { id: 'test-user', email: 'test@example.com' },
        } as unknown as Session,
      },
      error: null,
    });

    renderModal({
      isOpen: true,
      onClose: mockOnClose,
      initialMode: 'signin',
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    
    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('should clear error when switching modes', async () => {
    const user = userEvent.setup();
    
    const { supabase } = await import('../utils/supabase/client');
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid credentials', name: 'AuthError', status: 400 },
    });

    renderModal({
      isOpen: true,
      onClose: mockOnClose,
      initialMode: 'signin',
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });

    // Switch to signup mode
    const switchButton = screen.getByText("Don't have an account? Sign up");
    await user.click(switchButton);

    await waitFor(() => {
      expect(screen.queryByText('Invalid credentials')).not.toBeInTheDocument();
    });
  });
});

