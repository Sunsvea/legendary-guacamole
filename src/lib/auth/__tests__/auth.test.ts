/**
 * Unit tests for authentication functionality
 */

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    getUser: jest.fn(),
    onAuthStateChange: jest.fn(),
  },
};

jest.mock('../../supabase', () => ({
  getSupabaseClient: () => mockSupabaseClient,
}));

import { 
  signUp, 
  signIn, 
  signOut, 
  getCurrentUser, 
  AuthUser,
  AuthError 
} from '../auth';

describe('Authentication Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signUp', () => {
    it('should successfully sign up a new user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2025-01-01T00:00:00.000Z'
      };

      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null
      });

      const result = await signUp('test@example.com', 'password123');

      expect(result.user).toEqual(mockUser);
      expect(result.error).toBeNull();
      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });

    it('should return error when sign up fails', async () => {
      const mockError = {
        message: 'Email already exists',
        status: 400
      };

      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError
      });

      const result = await signUp('test@example.com', 'password123');

      expect(result.user).toBeNull();
      expect(result.error).toEqual(mockError);
    });

    it('should validate email format', async () => {
      const result = await signUp('invalid-email', 'password123');

      expect(result.user).toBeNull();
      expect(result.error?.message).toContain('Invalid email format');
      expect(mockSupabaseClient.auth.signUp).not.toHaveBeenCalled();
    });

    it('should validate password strength', async () => {
      const result = await signUp('test@example.com', 'weak');

      expect(result.user).toBeNull();
      expect(result.error?.message).toContain('Password must be at least 6 characters');
      expect(mockSupabaseClient.auth.signUp).not.toHaveBeenCalled();
    });
  });

  describe('signIn', () => {
    it('should successfully sign in existing user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2025-01-01T00:00:00.000Z'
      };

      const mockSession = {
        user: mockUser,
        access_token: 'token-123'
      };

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      });

      const result = await signIn('test@example.com', 'password123');

      expect(result.user).toEqual(mockUser);
      expect(result.error).toBeNull();
      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });

    it('should return error when credentials are invalid', async () => {
      const mockError = {
        message: 'Invalid login credentials',
        status: 401
      };

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError
      });

      const result = await signIn('test@example.com', 'wrongpassword');

      expect(result.user).toBeNull();
      expect(result.error).toEqual(mockError);
    });
  });

  describe('signOut', () => {
    it('should successfully sign out user', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: null
      });

      const result = await signOut();

      expect(result.error).toBeNull();
      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
    });

    it('should return error when sign out fails', async () => {
      const mockError = {
        message: 'Sign out failed',
        status: 500
      };

      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: mockError
      });

      const result = await signOut();

      expect(result.error).toEqual(mockError);
    });
  });

  describe('getCurrentUser', () => {
    it('should return current authenticated user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2025-01-01T00:00:00.000Z'
      };

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const result = await getCurrentUser();

      expect(result.user).toEqual(mockUser);
      expect(result.error).toBeNull();
    });

    it('should return null when no user is authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      });

      const result = await getCurrentUser();

      expect(result.user).toBeNull();
      expect(result.error).toBeNull();
    });

    it('should return error when getting user fails', async () => {
      const mockError = {
        message: 'Failed to get user',
        status: 500
      };

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: mockError
      });

      const result = await getCurrentUser();

      expect(result.user).toBeNull();
      expect(result.error).toEqual(mockError);
    });
  });
});