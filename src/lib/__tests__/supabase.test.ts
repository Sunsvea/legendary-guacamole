/**
 * Unit tests for Supabase client configuration
 */

// Mock the Supabase client to avoid ES module issues in Jest
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
    },
    from: jest.fn(),
    rpc: jest.fn(),
    storage: {
      from: jest.fn(),
    },
  })),
}));

import { createSupabaseClient, getSupabaseConfig } from '../supabase';

// Mock environment variables for testing
const mockEnv = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://test-project.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key-1234567890'
};

describe('Supabase Configuration', () => {
  beforeEach(() => {
    // Mock environment variables
    Object.assign(process.env, mockEnv);
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  describe('getSupabaseConfig', () => {
    it('should return config when environment variables are set', () => {
      const config = getSupabaseConfig();
      
      expect(config).toEqual({
        url: mockEnv.NEXT_PUBLIC_SUPABASE_URL,
        anonKey: mockEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
      });
    });

    it('should throw error when SUPABASE_URL is missing', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      
      expect(() => getSupabaseConfig()).toThrow(
        'Missing NEXT_PUBLIC_SUPABASE_URL environment variable'
      );
    });

    it('should throw error when SUPABASE_ANON_KEY is missing', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      expect(() => getSupabaseConfig()).toThrow(
        'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable'
      );
    });
  });

  describe('createSupabaseClient', () => {
    it('should create a Supabase client with correct configuration', () => {
      const client = createSupabaseClient();
      
      // Verify client is created (basic structure check)
      expect(client).toBeDefined();
      expect(client.auth).toBeDefined();
      expect(client.from).toBeDefined();
      expect(client.storage).toBeDefined();
    });

    it('should create client with custom configuration', () => {
      const customConfig = {
        url: 'https://custom-project.supabase.co',
        anonKey: 'custom-anon-key'
      };
      
      const client = createSupabaseClient(customConfig);
      
      expect(client).toBeDefined();
      expect(client.auth).toBeDefined();
    });
  });

  describe('Supabase Client Instance', () => {
    it('should have auth methods available', () => {
      const client = createSupabaseClient();
      
      expect(typeof client.auth.signUp).toBe('function');
      expect(typeof client.auth.signInWithPassword).toBe('function');
      expect(typeof client.auth.signOut).toBe('function');
      expect(typeof client.auth.getUser).toBe('function');
    });

    it('should have database methods available', () => {
      const client = createSupabaseClient();
      
      expect(typeof client.from).toBe('function');
      expect(typeof client.rpc).toBe('function');
    });

    it('should have storage methods available', () => {
      const client = createSupabaseClient();
      
      expect(client.storage).toBeDefined();
      expect(typeof client.storage.from).toBe('function');
    });
  });
});