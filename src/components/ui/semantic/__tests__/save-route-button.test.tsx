/**
 * Tests for SaveRouteButton component
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { SaveRouteButton } from '../save-route-button';
import { AuthProvider } from '@/contexts/auth-context';
import { Route } from '@/types/route';
import { DEFAULT_PATHFINDING_OPTIONS } from '@/types/pathfinding';

// Mock the database routes module
jest.mock('@/lib/database/routes', () => ({
  saveRoute: jest.fn()
}));

// Mock the auth module
jest.mock('@/lib/auth/auth', () => ({
  getCurrentUser: jest.fn(),
  onAuthStateChange: jest.fn(),
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
}));

import { saveRoute } from '@/lib/database/routes';
import { 
  getCurrentUser,
  onAuthStateChange,
  signIn,
  signUp,
  signOut 
} from '@/lib/auth/auth';

// Get the mocked functions
const mockSaveRoute = saveRoute as jest.MockedFunction<typeof saveRoute>;
const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>;
const mockOnAuthStateChange = onAuthStateChange as jest.MockedFunction<typeof onAuthStateChange>;
const mockSignIn = signIn as jest.MockedFunction<typeof signIn>;
const mockSignUp = signUp as jest.MockedFunction<typeof signUp>;
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>;

describe('SaveRouteButton', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    created_at: '2025-01-01T00:00:00.000Z'
  };

  const mockRoute: Route = {
    id: 'route-123',
    name: 'Test Alpine Route',
    start: { lat: 47.0000, lng: 8.0000, elevation: 1000 },
    end: { lat: 47.0100, lng: 8.0100, elevation: 1500 },
    points: [
      { lat: 47.0000, lng: 8.0000, elevation: 1000 },
      { lat: 47.0050, lng: 8.0050, elevation: 1250 },
      { lat: 47.0100, lng: 8.0100, elevation: 1500 }
    ],
    distance: 1.5,
    elevationGain: 500,
    difficulty: 'moderate',
    estimatedTime: 3600,
    createdAt: new Date('2025-01-01T10:00:00Z')
  };

  const mockOnSaveSuccess = jest.fn();
  const mockOnAuthRequired = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockGetCurrentUser.mockResolvedValue({ user: null, error: null });
    mockOnAuthStateChange.mockReturnValue(jest.fn());
    mockSignIn.mockResolvedValue({ user: null, error: null });
    mockSignUp.mockResolvedValue({ user: null, error: null });
    mockSignOut.mockResolvedValue({ error: null });
    mockSaveRoute.mockResolvedValue({
      success: true,
      data: {
        id: mockRoute.id,
        user_id: mockUser.id,
        name: mockRoute.name,
        route_data: mockRoute,
        pathfinding_options: DEFAULT_PATHFINDING_OPTIONS,
        is_public: false,
        tags: [],
        created_at: '2025-01-01T10:00:00Z',
        updated_at: '2025-01-01T10:00:00Z'
      },
      error: null
    });
  });

  function renderSaveRouteButton(authenticated = false) {
    if (authenticated) {
      mockGetCurrentUser.mockResolvedValue({ user: mockUser, error: null });
    }

    return render(
      <AuthProvider>
        <SaveRouteButton
          route={mockRoute}
          pathfindingOptions={DEFAULT_PATHFINDING_OPTIONS}
          onSaveSuccess={mockOnSaveSuccess}
          onAuthRequired={mockOnAuthRequired}
        />
      </AuthProvider>
    );
  }

  describe('Unauthenticated User', () => {
    it('should show sign in prompt for unauthenticated users', async () => {
      renderSaveRouteButton();

      await waitFor(() => {
        expect(screen.getByText('Sign in to save routes')).toBeInTheDocument();
      });
    });

    it('should call onAuthRequired when unauthenticated user clicks save', async () => {
      const user = userEvent.setup();
      renderSaveRouteButton();

      await waitFor(() => {
        expect(screen.getByText('Sign in to save routes')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /sign in to save routes/i }));

      expect(mockOnAuthRequired).toHaveBeenCalled();
    });
  });

  describe('Authenticated User', () => {
    it('should show save route button for authenticated users', async () => {
      renderSaveRouteButton(true);

      await waitFor(() => {
        expect(screen.getByText('Save Route')).toBeInTheDocument();
      });
    });

    it('should open save dialog when save button is clicked', async () => {
      const user = userEvent.setup();
      renderSaveRouteButton(true);

      await waitFor(() => {
        expect(screen.getByText('Save Route')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /save route/i }));

      await waitFor(() => {
        expect(screen.getByText('Save this route to your personal collection')).toBeInTheDocument();
        expect(screen.getByLabelText('Route Name')).toBeInTheDocument();
        expect(screen.getByLabelText('Make Public')).toBeInTheDocument();
        expect(screen.getByLabelText('Tags (optional)')).toBeInTheDocument();
      });
    });

    it('should have default route name in dialog', async () => {
      const user = userEvent.setup();
      renderSaveRouteButton(true);

      await waitFor(() => {
        expect(screen.getByText('Save Route')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /save route/i }));

      await waitFor(() => {
        const routeNameInput = screen.getByLabelText('Route Name') as HTMLInputElement;
        expect(routeNameInput.value).toBe(mockRoute.name);
      });
    });

    it('should save route with custom name and settings', async () => {
      const user = userEvent.setup();
      renderSaveRouteButton(true);

      await waitFor(() => {
        expect(screen.getByText('Save Route')).toBeInTheDocument();
      });

      // Open dialog
      await user.click(screen.getByRole('button', { name: /save route/i }));

      await waitFor(() => {
        expect(screen.getByLabelText('Route Name')).toBeInTheDocument();
      });

      // Fill in custom details
      const routeNameInput = screen.getByLabelText('Route Name');
      await user.clear(routeNameInput);
      await user.type(routeNameInput, 'My Custom Alpine Route');

      const publicCheckbox = screen.getByLabelText('Make Public');
      await user.click(publicCheckbox);

      const tagsInput = screen.getByLabelText('Tags (optional)');
      await user.type(tagsInput, 'summit, glacier, technical');

      // Save the route
      const saveButton = screen.getByRole('button', { name: 'Save' });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockSaveRoute).toHaveBeenCalledWith(
          { ...mockRoute, name: 'My Custom Alpine Route' },
          mockUser.id,
          DEFAULT_PATHFINDING_OPTIONS,
          true,
          ['summit', 'glacier', 'technical']
        );
      });

      expect(mockOnSaveSuccess).toHaveBeenCalled();
    });

    it('should handle save errors gracefully', async () => {
      const user = userEvent.setup();
      mockSaveRoute.mockResolvedValueOnce({
        success: false,
        data: null,
        error: { message: 'Database connection failed' }
      });

      renderSaveRouteButton(true);

      await waitFor(() => {
        expect(screen.getByText('Save Route')).toBeInTheDocument();
      });

      // Open dialog and save
      await user.click(screen.getByRole('button', { name: /save route/i }));

      await waitFor(() => {
        expect(screen.getByLabelText('Route Name')).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: 'Save' });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Database connection failed')).toBeInTheDocument();
      });

      expect(mockOnSaveSuccess).not.toHaveBeenCalled();
    });

    it('should close dialog when cancel is clicked', async () => {
      const user = userEvent.setup();
      renderSaveRouteButton(true);

      await waitFor(() => {
        expect(screen.getByText('Save Route')).toBeInTheDocument();
      });

      // Open dialog
      await user.click(screen.getByRole('button', { name: /save route/i }));

      await waitFor(() => {
        expect(screen.getByText('Save this route to your personal collection')).toBeInTheDocument();
      });

      // Click cancel
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('Save this route to your personal collection')).not.toBeInTheDocument();
      });
    });

    it('should disable save button when route name is empty', async () => {
      const user = userEvent.setup();
      renderSaveRouteButton(true);

      await waitFor(() => {
        expect(screen.getByText('Save Route')).toBeInTheDocument();
      });

      // Open dialog
      await user.click(screen.getByRole('button', { name: /save route/i }));

      await waitFor(() => {
        expect(screen.getByLabelText('Route Name')).toBeInTheDocument();
      });

      // Clear route name
      const routeNameInput = screen.getByLabelText('Route Name');
      await user.clear(routeNameInput);

      await waitFor(() => {
        const saveButton = screen.getByRole('button', { name: 'Save' });
        expect(saveButton).toBeDisabled();
      });
    });

    it('should show loading state while saving', async () => {
      const user = userEvent.setup();
      
      // Make saveRoute return a promise that doesn't resolve immediately
      let resolveSave: (value: Awaited<ReturnType<typeof saveRoute>>) => void;
      const savePromise = new Promise<Awaited<ReturnType<typeof saveRoute>>>(resolve => {
        resolveSave = resolve;
      });
      mockSaveRoute.mockReturnValueOnce(savePromise);

      renderSaveRouteButton(true);

      await waitFor(() => {
        expect(screen.getByText('Save Route')).toBeInTheDocument();
      });

      // Open dialog and save
      await user.click(screen.getByRole('button', { name: /save route/i }));

      await waitFor(() => {
        expect(screen.getByLabelText('Route Name')).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: 'Save' });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Saving...')).toBeInTheDocument();
      });

      // Resolve the promise
      act(() => {
        resolveSave!({
          success: true,
          data: {
            id: mockRoute.id,
            user_id: mockUser.id,
            name: mockRoute.name,
            route_data: mockRoute,
            pathfinding_options: DEFAULT_PATHFINDING_OPTIONS,
            is_public: false,
            tags: [],
            created_at: '2025-01-01T10:00:00Z',
            updated_at: '2025-01-01T10:00:00Z'
          },
          error: null
        });
      });

      await waitFor(() => {
        expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
      });
    });
  });
});