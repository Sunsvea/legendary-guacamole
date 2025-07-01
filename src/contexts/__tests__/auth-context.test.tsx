/**
 * Tests for authentication context
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthProvider, useAuth, useIsAuthenticated, useUser } from '../auth-context';

// Mock the auth module
jest.mock('../../lib/auth/auth', () => ({
  getCurrentUser: jest.fn(),
  onAuthStateChange: jest.fn(),
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
}));

import { 
  getCurrentUser,
  onAuthStateChange,
  signIn,
  signUp,
  signOut 
} from '../../lib/auth/auth';

// Get the mocked functions
const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>;
const mockOnAuthStateChange = onAuthStateChange as jest.MockedFunction<typeof onAuthStateChange>;
const mockSignIn = signIn as jest.MockedFunction<typeof signIn>;
const mockSignUp = signUp as jest.MockedFunction<typeof signUp>;
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>;

// Test component to access auth context
function TestComponent() {
  const { user, loading, signIn, signUp, signOut, refreshUser } = useAuth();
  const isAuthenticated = useIsAuthenticated();
  const currentUser = useUser();

  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'not-loading'}</div>
      <div data-testid="user">{user ? user.email : 'no-user'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
      <div data-testid="current-user">{currentUser ? currentUser.email : 'no-current-user'}</div>
      <button data-testid="signin" onClick={() => signIn('test@example.com', 'password')}>
        Sign In
      </button>
      <button data-testid="signup" onClick={() => signUp('test@example.com', 'password')}>
        Sign Up
      </button>
      <button data-testid="signout" onClick={() => signOut()}>
        Sign Out
      </button>
      <button data-testid="refresh" onClick={() => refreshUser()}>
        Refresh
      </button>
    </div>
  );
}

describe('AuthContext', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    created_at: '2025-01-01T00:00:00.000Z'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockGetCurrentUser.mockResolvedValue({ user: null, error: null });
    mockOnAuthStateChange.mockReturnValue(jest.fn());
    mockSignIn.mockResolvedValue({ user: null, error: null });
    mockSignUp.mockResolvedValue({ user: null, error: null });
    mockSignOut.mockResolvedValue({ error: null });
  });

  describe('Provider initialization', () => {
    it('should start with loading state', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('loading')).toHaveTextContent('loading');
      expect(screen.getByTestId('user')).toHaveTextContent('no-user');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
    });

    it('should load current user on initialization', async () => {
      mockGetCurrentUser.mockResolvedValue({ user: mockUser, error: null });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      expect(mockGetCurrentUser).toHaveBeenCalled();
    });

    it('should set up auth state change listener', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(mockOnAuthStateChange).toHaveBeenCalled();
    });

    it('should handle initialization errors gracefully', async () => {
      mockGetCurrentUser.mockRejectedValue(new Error('Network error'));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      expect(screen.getByTestId('user')).toHaveTextContent('no-user');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
    });
  });

  describe('Authentication methods', () => {
    it('should handle successful sign in', async () => {
      mockSignIn.mockResolvedValue({ user: mockUser, error: null });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      act(() => {
        screen.getByTestId('signin').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      });

      expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password');
    });

    it('should handle successful sign up', async () => {
      mockSignUp.mockResolvedValue({ user: mockUser, error: null });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      act(() => {
        screen.getByTestId('signup').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      });

      expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      expect(mockSignUp).toHaveBeenCalledWith('test@example.com', 'password');
    });

    it('should handle sign out', async () => {
      // Start with authenticated user
      mockGetCurrentUser.mockResolvedValue({ user: mockUser, error: null });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      });

      act(() => {
        screen.getByTestId('signout').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('no-user');
      });

      expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
      expect(mockSignOut).toHaveBeenCalled();
    });

    it('should handle refresh user', async () => {
      mockGetCurrentUser
        .mockResolvedValueOnce({ user: null, error: null }) // Initial load
        .mockResolvedValueOnce({ user: mockUser, error: null }); // Refresh

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('no-user');
      });

      act(() => {
        screen.getByTestId('refresh').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      });

      expect(mockGetCurrentUser).toHaveBeenCalledTimes(2);
    });
  });

  describe('Auth state change listener', () => {
    it('should update user on auth state change', async () => {
      let authCallback: (user: typeof mockUser | null) => void = () => {};
      
      mockOnAuthStateChange.mockImplementation((callback) => {
        authCallback = callback;
        return jest.fn();
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      // Simulate user sign in
      act(() => {
        authCallback(mockUser);
      });

      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
    });

    it('should clear user on sign out', async () => {
      let authCallback: (user: typeof mockUser | null) => void = () => {};
      
      mockOnAuthStateChange.mockImplementation((callback) => {
        authCallback = callback;
        return jest.fn();
      });

      // Start with authenticated user
      mockGetCurrentUser.mockResolvedValue({ user: mockUser, error: null });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      });

      // Simulate user sign out
      act(() => {
        authCallback(null);
      });

      expect(screen.getByTestId('user')).toHaveTextContent('no-user');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
    });
  });

  describe('Hooks', () => {
    it('should throw error when useAuth is used outside provider', () => {
      // Suppress console error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });

    it('should provide correct authentication status', async () => {
      mockGetCurrentUser.mockResolvedValue({ user: mockUser, error: null });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
        expect(screen.getByTestId('current-user')).toHaveTextContent('test@example.com');
      });
    });

    it('should handle missing email in user object', async () => {
      const userWithoutEmail = { ...mockUser, email: undefined };
      mockGetCurrentUser.mockResolvedValue({ user: userWithoutEmail, error: null });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('');
      });
    });
  });

  describe('Cleanup', () => {
    it('should unsubscribe from auth changes on unmount', () => {
      const mockUnsubscribe = jest.fn();
      mockOnAuthStateChange.mockReturnValue(mockUnsubscribe);

      const { unmount } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });
});