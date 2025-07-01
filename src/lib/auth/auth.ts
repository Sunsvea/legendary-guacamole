/**
 * Authentication functions for user management
 */

import { getSupabaseClient } from '../supabase';

/**
 * User authentication data structure
 */
export interface AuthUser {
  id: string;
  email: string;
  created_at: string;
}

/**
 * Authentication error structure
 */
export interface AuthError {
  message: string;
  status?: number;
}

/**
 * Authentication result wrapper
 */
export interface AuthResult {
  user: AuthUser | null;
  error: AuthError | null;
}

/**
 * Sign out result wrapper
 */
export interface SignOutResult {
  error: AuthError | null;
}

/**
 * Email validation regex
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate email format
 * @param email Email to validate
 * @returns True if email is valid
 */
function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

/**
 * Validate password strength
 * @param password Password to validate
 * @returns True if password meets requirements
 */
function isValidPassword(password: string): boolean {
  return password.length >= 6;
}

/**
 * Sign up a new user with email and password
 * @param email User email
 * @param password User password
 * @returns Authentication result with user data or error
 */
export async function signUp(email: string, password: string): Promise<AuthResult> {
  // Client-side validation
  if (!isValidEmail(email)) {
    return {
      user: null,
      error: {
        message: 'Invalid email format',
        status: 400
      }
    };
  }

  if (!isValidPassword(password)) {
    return {
      user: null,
      error: {
        message: 'Password must be at least 6 characters long',
        status: 400
      }
    };
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      return {
        user: null,
        error: {
          message: error.message,
          status: 400
        }
      };
    }

    return {
      user: data.user ? {
        id: data.user.id,
        email: data.user.email || email,
        created_at: data.user.created_at
      } : null,
      error: null
    };
  } catch (error) {
    return {
      user: null,
      error: {
        message: error instanceof Error ? error.message : 'Sign up failed',
        status: 500
      }
    };
  }
}

/**
 * Sign in existing user with email and password
 * @param email User email
 * @param password User password
 * @returns Authentication result with user data or error
 */
export async function signIn(email: string, password: string): Promise<AuthResult> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return {
        user: null,
        error: {
          message: error.message,
          status: 401
        }
      };
    }

    return {
      user: data.user ? {
        id: data.user.id,
        email: data.user.email || email,
        created_at: data.user.created_at
      } : null,
      error: null
    };
  } catch (error) {
    return {
      user: null,
      error: {
        message: error instanceof Error ? error.message : 'Sign in failed',
        status: 500
      }
    };
  }
}

/**
 * Sign out current user
 * @returns Sign out result with potential error
 */
export async function signOut(): Promise<SignOutResult> {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        error: {
          message: error.message,
          status: 500
        }
      };
    }

    return {
      error: null
    };
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : 'Sign out failed',
        status: 500
      }
    };
  }
}

/**
 * Get current authenticated user
 * @returns Authentication result with current user or null
 */
export async function getCurrentUser(): Promise<AuthResult> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      return {
        user: null,
        error: {
          message: error.message,
          status: 500
        }
      };
    }

    return {
      user: data.user ? {
        id: data.user.id,
        email: data.user.email || '',
        created_at: data.user.created_at
      } : null,
      error: null
    };
  } catch (error) {
    return {
      user: null,
      error: {
        message: error instanceof Error ? error.message : 'Failed to get user',
        status: 500
      }
    };
  }
}

/**
 * Subscribe to authentication state changes
 * @param callback Function to call when auth state changes
 * @returns Unsubscribe function
 */
export function onAuthStateChange(
  callback: (user: AuthUser | null) => void
): () => void {
  const supabase = getSupabaseClient();
  
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    const user = session?.user ? {
      id: session.user.id,
      email: session.user.email || '',
      created_at: session.user.created_at
    } : null;
    
    callback(user);
  });

  return () => {
    subscription.unsubscribe();
  };
}