/**
 * Tests for route detail modal component
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouteDetailModal } from '../route-detail-modal';
import { DatabaseRoute } from '@/types/database';

// Mock the auth context
const mockUseAuth = jest.fn();
jest.mock('@/contexts/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock the route copy function
const mockCopyRouteToUser = jest.fn();
jest.mock('@/lib/database/route-copy', () => ({
  copyRouteToUser: (...args: any[]) => mockCopyRouteToUser(...args),
}));

// Mock the map component
jest.mock('@/components/ui/route-map', () => ({
  RouteMap: ({ route }: { route: any }) => (
    <div data-testid="route-map">Map for {route.name}</div>
  ),
}));

// Mock the elevation chart
jest.mock('@/components/ui/elevation-chart', () => ({
  ElevationChart: ({ route }: { route: any }) => (
    <div data-testid="elevation-chart">Elevation for {route.name}</div>
  ),
}));

const mockRoute: DatabaseRoute = {
  id: 'route-123',
  user_id: 'other-user',
  name: 'Spectacular Alpine Route',
  route_data: {
    id: 'route-123',
    name: 'Spectacular Alpine Route',
    start: { lat: 47.0000, lng: 8.0000, elevation: 1000 },
    end: { lat: 47.0100, lng: 8.0100, elevation: 1500 },
    points: [
      { lat: 47.0000, lng: 8.0000, elevation: 1000 },
      { lat: 47.0050, lng: 8.0050, elevation: 1250 },
      { lat: 47.0100, lng: 8.0100, elevation: 1500 }
    ],
    distance: 5.2,
    elevationGain: 500,
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
  tags: ['alpine', 'moderate', 'scenic'],
  created_at: '2025-01-01T10:00:00Z',
  updated_at: '2025-01-01T10:00:00Z'
};

const mockUser = {
  id: 'current-user',
  email: 'test@example.com',
};

describe('RouteDetailModal', () => {
  const mockOnClose = jest.fn();
  const mockOnCopySuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
    });
  });

  it('should render route details when open', () => {
    render(
      <RouteDetailModal
        route={mockRoute}
        isOpen={true}
        onClose={mockOnClose}
        onCopySuccess={mockOnCopySuccess}
      />
    );

    expect(screen.getByText('Spectacular Alpine Route')).toBeInTheDocument();
    expect(screen.getByText('5.2 km')).toBeInTheDocument();
    expect(screen.getByText('500 m')).toBeInTheDocument();
    expect(screen.getByText('Moderate')).toBeInTheDocument();
    expect(screen.getByText('2.0 hrs')).toBeInTheDocument();
    expect(screen.getByTestId('route-map')).toBeInTheDocument();
    expect(screen.getByTestId('elevation-chart')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(
      <RouteDetailModal
        route={mockRoute}
        isOpen={false}
        onClose={mockOnClose}
        onCopySuccess={mockOnCopySuccess}
      />
    );

    expect(screen.queryByText('Spectacular Alpine Route')).not.toBeInTheDocument();
  });

  it('should show copy to my routes button for authenticated users', () => {
    render(
      <RouteDetailModal
        route={mockRoute}
        isOpen={true}
        onClose={mockOnClose}
        onCopySuccess={mockOnCopySuccess}
      />
    );

    expect(screen.getByText('Copy to My Routes')).toBeInTheDocument();
  });

  it('should show sign in message for unauthenticated users', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
    });

    render(
      <RouteDetailModal
        route={mockRoute}
        isOpen={true}
        onClose={mockOnClose}
        onCopySuccess={mockOnCopySuccess}
      />
    );

    expect(screen.getByText('Sign in to copy routes')).toBeInTheDocument();
    expect(screen.queryByText('Copy to My Routes')).not.toBeInTheDocument();
  });

  it('should handle copy route action', async () => {
    mockCopyRouteToUser.mockResolvedValue({
      success: true,
      data: { ...mockRoute, user_id: mockUser.id, id: 'new-route-id' },
      error: null
    });

    render(
      <RouteDetailModal
        route={mockRoute}
        isOpen={true}
        onClose={mockOnClose}
        onCopySuccess={mockOnCopySuccess}
      />
    );

    const copyButton = screen.getByText('Copy to My Routes');
    await userEvent.click(copyButton);

    await waitFor(() => {
      expect(mockCopyRouteToUser).toHaveBeenCalledWith(mockRoute, mockUser.id);
      expect(mockOnCopySuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUser.id,
          id: 'new-route-id'
        })
      );
    });
  });

  it('should show loading state while copying', async () => {
    mockCopyRouteToUser.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <RouteDetailModal
        route={mockRoute}
        isOpen={true}
        onClose={mockOnClose}
        onCopySuccess={mockOnCopySuccess}
      />
    );

    const copyButton = screen.getByText('Copy to My Routes');
    await userEvent.click(copyButton);

    expect(screen.getByText('Copying...')).toBeInTheDocument();
    expect(copyButton).toBeDisabled();
  });

  it('should handle copy error', async () => {
    mockCopyRouteToUser.mockResolvedValue({
      success: false,
      data: null,
      error: { message: 'Failed to copy route' }
    });

    render(
      <RouteDetailModal
        route={mockRoute}
        isOpen={true}
        onClose={mockOnClose}
        onCopySuccess={mockOnCopySuccess}
      />
    );

    const copyButton = screen.getByText('Copy to My Routes');
    await userEvent.click(copyButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to copy route')).toBeInTheDocument();
    });
  });

  it('should close modal when close button clicked', async () => {
    render(
      <RouteDetailModal
        route={mockRoute}
        isOpen={true}
        onClose={mockOnClose}
        onCopySuccess={mockOnCopySuccess}
      />
    );

    const closeButton = screen.getByLabelText('Close modal');
    await userEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should close modal when backdrop clicked', async () => {
    render(
      <RouteDetailModal
        route={mockRoute}
        isOpen={true}
        onClose={mockOnClose}
        onCopySuccess={mockOnCopySuccess}
      />
    );

    const backdrop = screen.getByTestId('modal-backdrop');
    await userEvent.click(backdrop);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should display route tags', () => {
    render(
      <RouteDetailModal
        route={mockRoute}
        isOpen={true}
        onClose={mockOnClose}
        onCopySuccess={mockOnCopySuccess}
      />
    );

    // Find the tags section specifically
    const tagsSection = screen.getByText('Tags').closest('div');
    expect(tagsSection).toHaveTextContent('alpine');
    expect(tagsSection).toHaveTextContent('moderate');
    expect(tagsSection).toHaveTextContent('scenic');
  });

  it('should show route creation date', () => {
    render(
      <RouteDetailModal
        route={mockRoute}
        isOpen={true}
        onClose={mockOnClose}
        onCopySuccess={mockOnCopySuccess}
      />
    );

    expect(screen.getByText('Created Jan 1, 2025')).toBeInTheDocument();
  });

  it('should prevent copying own routes', () => {
    const ownRoute = { ...mockRoute, user_id: mockUser.id };

    render(
      <RouteDetailModal
        route={ownRoute}
        isOpen={true}
        onClose={mockOnClose}
        onCopySuccess={mockOnCopySuccess}
      />
    );

    expect(screen.queryByText('Copy to My Routes')).not.toBeInTheDocument();
    expect(screen.getByText('This is your route')).toBeInTheDocument();
  });
});