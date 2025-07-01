/**
 * Integration tests for gallery with route copy functionality
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GalleryPage from '@/app/gallery/page';

// Mock the auth context
const mockUseAuth = jest.fn();
jest.mock('@/contexts/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock database operations
const mockGetPublicRoutes = jest.fn();
const mockCopyRouteToUser = jest.fn();

jest.mock('@/lib/database/routes', () => ({
  getPublicRoutes: () => mockGetPublicRoutes(),
}));

jest.mock('@/lib/database/route-copy', () => ({
  copyRouteToUser: (...args: any[]) => mockCopyRouteToUser(...args),
}));

// Mock the RouteMap component to avoid mapbox-gl issues in tests
jest.mock('@/components/ui/route-map', () => ({
  RouteMap: ({ route }: { route: any }) => (
    <div data-testid="route-map">Map for {route.name}</div>
  ),
}));

// Mock the ElevationChart component
jest.mock('@/components/ui/elevation-chart', () => ({
  ElevationChart: ({ route }: { route: any }) => (
    <div data-testid="elevation-chart">Elevation for {route.name}</div>
  ),
}));

const mockUser = {
  id: 'current-user',
  email: 'test@example.com',
};

const mockRoutes = [
  {
    id: 'route-1',
    user_id: 'other-user',
    name: 'Alpine Adventure',
    route_data: {
      id: 'route-1',
      name: 'Alpine Adventure',
      start: { lat: 47.0000, lng: 8.0000, elevation: 1000 },
      end: { lat: 47.0100, lng: 8.0100, elevation: 1500 },
      points: [],
      distance: 5.2,
      elevationGain: 800,
      difficulty: 'moderate',
      estimatedTime: 7200,
      createdAt: new Date('2025-01-01T10:00:00Z')
    },
    pathfinding_options: {
      trailWeight: 0.7,
      elevationWeight: 0.3,
      difficultyPreference: 'moderate',
      avoidSteepTerrain: false,
      preferScenicRoutes: true,
      maxDetourFactor: 1.5,
      safetyBuffer: 100
    },
    is_public: true,
    tags: ['hiking', 'moderate'],
    created_at: '2025-01-01T10:00:00Z',
    updated_at: '2025-01-01T10:00:00Z'
  }
];

describe('Gallery Route Copy Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers(); // Ensure we start with real timers for each test
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
    });
    mockGetPublicRoutes.mockResolvedValue({
      success: true,
      data: mockRoutes,
      error: null,
    });
  });

  afterEach(() => {
    jest.useRealTimers(); // Clean up after each test
  });

  it('should show route detail modal when route card is clicked', async () => {
    render(<GalleryPage />);

    await waitFor(() => {
      expect(screen.getByText('Alpine Adventure')).toBeInTheDocument();
    });

    const routeCard = screen.getByTestId('route-card-route-1');
    await userEvent.click(routeCard);

    await waitFor(() => {
      expect(screen.getByTestId('route-detail-modal')).toBeInTheDocument();
      expect(screen.getByText('Copy to My Routes')).toBeInTheDocument();
    });
  });

  it('should successfully copy route from gallery', async () => {
    const copiedRoute = {
      ...mockRoutes[0],
      id: 'new-route-id',
      user_id: mockUser.id,
      name: 'Alpine Adventure (Copy)',
      is_public: false
    };

    mockCopyRouteToUser.mockResolvedValue({
      success: true,
      data: copiedRoute,
      error: null
    });

    render(<GalleryPage />);

    // Open route detail modal
    await waitFor(() => {
      expect(screen.getByText('Alpine Adventure')).toBeInTheDocument();
    });

    const routeCard = screen.getByTestId('route-card-route-1');
    await userEvent.click(routeCard);

    await waitFor(() => {
      expect(screen.getByText('Copy to My Routes')).toBeInTheDocument();
    });

    // Copy the route
    const copyButton = screen.getByText('Copy to My Routes');
    await userEvent.click(copyButton);

    await waitFor(() => {
      expect(mockCopyRouteToUser).toHaveBeenCalledWith(
        mockRoutes[0],
        mockUser.id
      );
      expect(screen.getByText('Route copied successfully!')).toBeInTheDocument();
    });
  });

  it('should handle copy errors gracefully', async () => {
    mockCopyRouteToUser.mockResolvedValue({
      success: false,
      data: null,
      error: { message: 'Failed to copy route' }
    });

    render(<GalleryPage />);

    // Open route detail and attempt copy
    await waitFor(() => {
      expect(screen.getByText('Alpine Adventure')).toBeInTheDocument();
    });

    const routeCard = screen.getByTestId('route-card-route-1');
    await userEvent.click(routeCard);

    await waitFor(() => {
      expect(screen.getByText('Copy to My Routes')).toBeInTheDocument();
    });

    const copyButton = screen.getByText('Copy to My Routes');
    await userEvent.click(copyButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to copy route')).toBeInTheDocument();
    });
  });

  it('should show success message and modal behavior after successful copy', async () => {
    const copiedRoute = {
      ...mockRoutes[0],
      id: 'new-route-id',
      user_id: mockUser.id,
      name: 'Alpine Adventure (Copy)',
      is_public: false
    };

    mockCopyRouteToUser.mockResolvedValue({
      success: true,
      data: copiedRoute,
      error: null
    });

    render(<GalleryPage />);

    // Open route detail modal and copy
    await waitFor(() => {
      expect(screen.getByText('Alpine Adventure')).toBeInTheDocument();
    });

    const routeCard = screen.getByTestId('route-card-route-1');
    await userEvent.click(routeCard);

    await waitFor(() => {
      expect(screen.getByText('Copy to My Routes')).toBeInTheDocument();
    });

    const copyButton = screen.getByText('Copy to My Routes');
    await userEvent.click(copyButton);

    // Should show success message
    await waitFor(() => {
      expect(screen.getByText('Route copied successfully!')).toBeInTheDocument();
    });

    // Modal should still be open initially (before timeout)
    expect(screen.getByTestId('route-detail-modal')).toBeInTheDocument();
  });

  it('should not show copy button for unauthenticated users', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
    });

    render(<GalleryPage />);

    await waitFor(() => {
      expect(screen.getByText('Alpine Adventure')).toBeInTheDocument();
    });

    const routeCard = screen.getByTestId('route-card-route-1');
    await userEvent.click(routeCard);

    await waitFor(() => {
      expect(screen.getByTestId('route-detail-modal')).toBeInTheDocument();
      expect(screen.queryByText('Copy to My Routes')).not.toBeInTheDocument();
      expect(screen.getByText('Sign in to copy routes')).toBeInTheDocument();
    });
  });

  it('should not show copy button for own routes', async () => {
    const ownRoute = { ...mockRoutes[0], user_id: mockUser.id };
    mockGetPublicRoutes.mockResolvedValue({
      success: true,
      data: [ownRoute],
      error: null,
    });

    render(<GalleryPage />);

    await waitFor(() => {
      expect(screen.getByText('Alpine Adventure')).toBeInTheDocument();
    });

    const routeCard = screen.getByTestId('route-card-route-1');
    await userEvent.click(routeCard);

    await waitFor(() => {
      expect(screen.getByTestId('route-detail-modal')).toBeInTheDocument();
      expect(screen.queryByText('Copy to My Routes')).not.toBeInTheDocument();
      expect(screen.getByText('This is your route')).toBeInTheDocument();
    });
  });
});