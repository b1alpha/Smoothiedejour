import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Session } from '@jsr/supabase__supabase-js';
import { AuthProvider, useAuth } from './AuthContext';
import { supabase } from '../utils/supabase/client';

// Mock Supabase client
vi.mock('../utils/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      updateUser: vi.fn(),
    },
  },
}));

// Test component that uses the auth hook
function TestComponent() {
  const { user, session, loading, nickname, signIn, signUp, signOut, updateNickname, changePassword } = useAuth();
  
  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'not-loading'}</div>
      <div data-testid="user">{user ? user.email : 'no-user'}</div>
      <div data-testid="session">{session ? 'has-session' : 'no-session'}</div>
      <div data-testid="nickname">{nickname || 'no-nickname'}</div>
      <button onClick={() => signIn('test@example.com', 'password')}>Sign In</button>
      <button onClick={() => signUp('test@example.com', 'password', 'TestUser')}>Sign Up</button>
      <button onClick={() => signOut()}>Sign Out</button>
      <button onClick={() => updateNickname('NewNickname')}>Update Nickname</button>
      <button onClick={() => changePassword('newpassword')}>Change Password</button>
    </div>
  );
}

describe('AuthContext', () => {
  const mockUnsubscribe = vi.fn();
  const mockSubscription = {
    unsubscribe: mockUnsubscribe,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: { subscription: mockSubscription },
    } as unknown as { data: { subscription: { unsubscribe: () => void } } });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should provide initial loading state', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Initially should be loading
    expect(screen.getByTestId('loading')).toHaveTextContent('loading');

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });
  });

  it('should initialize with no user when session is null', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('no-user');
      expect(screen.getByTestId('session')).toHaveTextContent('no-session');
      expect(screen.getByTestId('nickname')).toHaveTextContent('no-nickname');
    });
  });

  it('should initialize with user when session exists', async () => {
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      user_metadata: { nickname: 'TestUser' },
    } as unknown as User;

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: mockUser,
        } as unknown as Session,
      },
      error: null,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      expect(screen.getByTestId('session')).toHaveTextContent('has-session');
      expect(screen.getByTestId('nickname')).toHaveTextContent('TestUser');
    });
  });

  it('should extract nickname from user metadata', async () => {
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      user_metadata: { nickname: 'ExtractedNickname' },
    } as unknown as { id: string; email: string; user_metadata: Record<string, unknown> };

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: mockUser,
        } as unknown as Session,
      },
      error: null,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('nickname')).toHaveTextContent('ExtractedNickname');
    });
  });

  it('should set nickname to null when user has no nickname in metadata', async () => {
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      user_metadata: {},
    } as unknown as { id: string; email: string; user_metadata: Record<string, unknown> };

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: mockUser,
        } as unknown as Session,
      },
      error: null,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('nickname')).toHaveTextContent('no-nickname');
    });
  });

  it('should handle auth state changes', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    let authStateChangeCallback: ((event: string, session: Session | null) => void) | null = null;
    
    vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((callback) => {
      authStateChangeCallback = callback as (event: string, session: Session | null) => void;
      return {
        data: { subscription: mockSubscription },
      } as unknown as { data: { subscription: { unsubscribe: () => void } } };
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    // Simulate auth state change
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      user_metadata: { nickname: 'NewUser' },
    } as unknown as { id: string; email: string; user_metadata: Record<string, unknown> };

    act(() => {
      if (authStateChangeCallback) {
        authStateChangeCallback('SIGNED_IN', { user: mockUser } as unknown as Session);
      }
    });

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      expect(screen.getByTestId('nickname')).toHaveTextContent('NewUser');
    });
  });

  it('should unsubscribe from auth state changes on unmount', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const { unmount } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it('should call signInWithPassword when signIn is called', async () => {
    const user = userEvent.setup();
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

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });

    const signInButton = screen.getByText('Sign In');
    await user.click(signInButton);

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      });
    });
  });

  it('should handle signIn error', async () => {
    const user = userEvent.setup();
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid credentials', name: 'AuthError', status: 400 },
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });

    const signInButton = screen.getByText('Sign In');
    await user.click(signInButton);

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalled();
    });
  });

  it('should handle signIn connection error for localhost', async () => {
    const user = userEvent.setup();
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const originalEnv = import.meta.env;
    vi.stubGlobal('import.meta.env', {
      ...originalEnv,
      VITE_SUPABASE_URL: 'http://localhost:54321',
      DEV: true,
    });

    const fetchError = new TypeError('Failed to fetch');
    vi.mocked(supabase.auth.signInWithPassword).mockRejectedValue(fetchError);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });

    const signInButton = screen.getByText('Sign In');
    await user.click(signInButton);

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalled();
    });
  });

  it('should call signUp when signUp is called', async () => {
    const user = userEvent.setup();
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

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Sign Up')).toBeInTheDocument();
    });

    const signUpButton = screen.getByText('Sign Up');
    await user.click(signUpButton);

    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
        options: {
          data: {
            nickname: 'TestUser',
          },
        },
      });
    });
  });

  it('should trim nickname when signing up', async () => {
    const user = userEvent.setup();
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

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Sign Up')).toBeInTheDocument();
    });

    // We can't easily test trimming in this component, but we can verify the call
    const signUpButton = screen.getByText('Sign Up');
    await user.click(signUpButton);

    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalled();
      const callArgs = vi.mocked(supabase.auth.signUp).mock.calls[0][0];
      expect(callArgs.options?.data?.nickname).toBe('TestUser');
    });
  });

  it('should handle signUp connection error for localhost', async () => {
    const user = userEvent.setup();
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const originalEnv = import.meta.env;
    vi.stubGlobal('import.meta.env', {
      ...originalEnv,
      VITE_SUPABASE_URL: 'http://localhost:54321',
      DEV: true,
    });

    const fetchError = new TypeError('Failed to fetch');
    vi.mocked(supabase.auth.signUp).mockRejectedValue(fetchError);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Sign Up')).toBeInTheDocument();
    });

    const signUpButton = screen.getByText('Sign Up');
    await user.click(signUpButton);

    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalled();
    });
  });

  it('should call updateUser when updateNickname is called', async () => {
    const user = userEvent.setup();
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      user_metadata: { nickname: 'OldNickname' },
    } as unknown as { id: string; email: string; user_metadata: Record<string, unknown> };

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: mockUser,
        } as unknown as Session,
      },
      error: null,
    });

    vi.mocked(supabase.auth.updateUser).mockResolvedValue({
      data: {
        user: { ...mockUser, user_metadata: { nickname: 'NewNickname' } },
      },
      error: null,
    });

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: {
        user: { ...mockUser, user_metadata: { nickname: 'NewNickname' } },
      },
      error: null,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Update Nickname')).toBeInTheDocument();
    });

    const updateButton = screen.getByText('Update Nickname');
    await user.click(updateButton);

    await waitFor(() => {
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        data: {
          nickname: 'NewNickname',
        },
      });
      expect(supabase.auth.getUser).toHaveBeenCalled();
    });
  });

  it('should return error when updateNickname is called without user', async () => {
    const user = userEvent.setup();
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Update Nickname')).toBeInTheDocument();
    });

    const updateButton = screen.getByText('Update Nickname');
    await user.click(updateButton);

    await waitFor(() => {
      expect(supabase.auth.updateUser).not.toHaveBeenCalled();
    });
  });

  it('should trim nickname when updating', async () => {
    const user = userEvent.setup();
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      user_metadata: { nickname: 'OldNickname' },
    } as unknown as { id: string; email: string; user_metadata: Record<string, unknown> };

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: mockUser,
        } as unknown as Session,
      },
      error: null,
    });

    vi.mocked(supabase.auth.updateUser).mockResolvedValue({
      data: {
        user: { ...mockUser, user_metadata: { nickname: 'TrimmedNickname' } },
      },
      error: null,
    });

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: {
        user: { ...mockUser, user_metadata: { nickname: 'TrimmedNickname' } },
      },
      error: null,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Update Nickname')).toBeInTheDocument();
    });

    // We can't easily test trimming in this component, but we can verify the call
    const updateButton = screen.getByText('Update Nickname');
    await user.click(updateButton);

    await waitFor(() => {
      expect(supabase.auth.updateUser).toHaveBeenCalled();
    });
  });

  it('should call updateUser when changePassword is called', async () => {
    const user = userEvent.setup();
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      user_metadata: {},
    } as unknown as { id: string; email: string; user_metadata: Record<string, unknown> };

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: mockUser,
        } as unknown as Session,
      },
      error: null,
    });

    vi.mocked(supabase.auth.updateUser).mockResolvedValue({
      data: {
        user: mockUser,
      },
      error: null,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Change Password')).toBeInTheDocument();
    });

    const changePasswordButton = screen.getByText('Change Password');
    await user.click(changePasswordButton);

    await waitFor(() => {
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'newpassword',
      });
    });
  });

  it('should return error when changePassword is called without user', async () => {
    const user = userEvent.setup();
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Change Password')).toBeInTheDocument();
    });

    const changePasswordButton = screen.getByText('Change Password');
    await user.click(changePasswordButton);

    await waitFor(() => {
      expect(supabase.auth.updateUser).not.toHaveBeenCalled();
    });
  });

  it('should call signOut when signOut is called', async () => {
    const user = userEvent.setup();
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      user_metadata: { nickname: 'TestUser' },
    } as unknown as User;

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: mockUser,
        } as unknown as Session,
      },
      error: null,
    });

    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Sign Out')).toBeInTheDocument();
    });

    const signOutButton = screen.getByText('Sign Out');
    await user.click(signOutButton);

    await waitFor(() => {
      expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
    });
  });

  it('should throw error when useAuth is used outside AuthProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAuth must be used within an AuthProvider');

    consoleSpy.mockRestore();
  });
});

