/**
 * Authentication context for managing user state across the application
 */

'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  getCurrentUser, 
  onAuthStateChange, 
  signIn as authSignIn,
  signUp as authSignUp,
  signOut as authSignOut,
  AuthResult 
} from '@/lib/auth/auth';

/**
 * User object from authentication
 */
export interface User {
  id: string;
  email: string;
  created_at: string;
}

/**
 * Authentication context state
 */
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<{ error: { message: string; code?: string } | null }>;
  refreshUser: () => Promise<void>;
}

/**
 * Authentication context
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication provider props
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication provider component
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Refresh current user from authentication service
   */
  const refreshUser = async () => {
    try {
      const result = await getCurrentUser();
      if (result.user) {
        setUser({
          id: result.user.id,
          email: result.user.email,
          created_at: result.user.created_at
        });
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      setUser(null);
    }
  };

  /**
   * Sign in wrapper with state management
   */
  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    const result = await authSignIn(email, password);
    if (result.user) {
      setUser({
        id: result.user.id,
        email: result.user.email,
        created_at: result.user.created_at
      });
    }
    return result;
  };

  /**
   * Sign up wrapper with state management
   */
  const signUp = async (email: string, password: string): Promise<AuthResult> => {
    const result = await authSignUp(email, password);
    if (result.user) {
      setUser({
        id: result.user.id,
        email: result.user.email,
        created_at: result.user.created_at
      });
    }
    return result;
  };

  /**
   * Sign out wrapper with state management
   */
  const signOut = async () => {
    const result = await authSignOut();
    setUser(null);
    return result;
  };

  /**
   * Initialize authentication state and set up auth listener
   */
  useEffect(() => {
    // Get initial user state
    refreshUser().finally(() => setLoading(false));

    // Set up auth state change listener
    const unsubscribe = onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use authentication context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Hook to check if user is authenticated
 */
export function useIsAuthenticated(): boolean {
  const { user, loading } = useAuth();
  return !loading && user !== null;
}

/**
 * Hook to get current user or null
 */
export function useUser(): User | null {
  const { user } = useAuth();
  return user;
}