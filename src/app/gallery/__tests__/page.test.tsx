/**
 * Tests for public route gallery page
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GalleryPage from '../page';

// Mock the database operations
const mockGetPublicRoutes = jest.fn();
jest.mock('@/lib/database/routes', () => ({
  getPublicRoutes: () => mockGetPublicRoutes(),
}));

// Mock the auth context
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
};

const mockUseAuth = jest.fn();
jest.mock('@/contexts/auth-context', () => ({
  ...jest.requireActual('@/contexts/auth-context'),
  useAuth: () => mockUseAuth(),
}));

// Mock components we'll create
jest.mock('@/components/gallery/gallery-layout', () => ({
  GalleryLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="gallery-layout">{children}</div>
  ),
}));

interface MockRoute {
  id: string;
  name: string;
}

interface MockFilters {
  difficulty?: string;
}

jest.mock('@/components/gallery/route-gallery-grid', () => ({
  RouteGalleryGrid: ({ routes, onRouteSelect }: { routes: MockRoute[]; onRouteSelect: (route: MockRoute) => void }) => (
    <div data-testid="route-gallery-grid">
      {routes.map((route: MockRoute) => (
        <button 
          key={route.id} 
          onClick={() => onRouteSelect(route)}
          data-testid={`route-${route.id}`}
        >
          {route.name}
        </button>
      ))}
    </div>
  ),
}));

jest.mock('@/components/gallery/gallery-filters', () => ({
  GalleryFilters: ({ onFiltersChange }: { onFiltersChange: (filters: MockFilters) => void }) => (
    <div data-testid="gallery-filters">
      <button onClick={() => onFiltersChange({ difficulty: 'easy' })}>
        Filter Easy
      </button>
    </div>
  ),
}));

const mockRoutes = [
  {
    id: 'route-1',
    name: 'Alpine Adventure',
    route_data: {
      difficulty: 'moderate',
      distance: 5.2,
      elevationGain: 800,
    },
    user_id: 'other-user',
    is_public: true,
    created_at: '2025-01-01T10:00:00Z',
  },
  {
    id: 'route-2', 
    name: 'Summit Challenge',
    route_data: {
      difficulty: 'hard',
      distance: 8.1,
      elevationGain: 1200,
    },
    user_id: 'another-user',
    is_public: true,
    created_at: '2025-01-02T10:00:00Z',
  },
];

describe('Gallery Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
    });
  });

  it('should render gallery layout and load public routes', async () => {
    mockGetPublicRoutes.mockResolvedValue({
      success: true,
      data: mockRoutes,
      error: null,
    });

    render(<GalleryPage />);

    expect(screen.getByTestId('gallery-layout')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByTestId('route-gallery-grid')).toBeInTheDocument();
      expect(screen.getByText('Alpine Adventure')).toBeInTheDocument();
      expect(screen.getByText('Summit Challenge')).toBeInTheDocument();
    });

    expect(mockGetPublicRoutes).toHaveBeenCalled();
  });

  it('should handle loading state', () => {
    mockGetPublicRoutes.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<GalleryPage />);

    expect(screen.getByText('Loading routes...')).toBeInTheDocument();
  });

  it('should handle error state', async () => {
    mockGetPublicRoutes.mockResolvedValue({
      success: false,
      data: null,
      error: { message: 'Failed to load routes' },
    });

    render(<GalleryPage />);

    await waitFor(() => {
      expect(screen.getByText('Error Loading Routes')).toBeInTheDocument();
      expect(screen.getByText('Failed to load routes')).toBeInTheDocument();
    });
  });

  it('should handle empty state', async () => {
    mockGetPublicRoutes.mockResolvedValue({
      success: true,
      data: [],
      error: null,
    });

    render(<GalleryPage />);

    await waitFor(() => {
      expect(screen.getByText('No Public Routes')).toBeInTheDocument();
    });
  });

  it('should filter routes when filters change', async () => {
    mockGetPublicRoutes.mockResolvedValue({
      success: true,
      data: mockRoutes,
      error: null,
    });

    render(<GalleryPage />);

    await waitFor(() => {
      expect(screen.getByTestId('gallery-filters')).toBeInTheDocument();
    });

    const filterButton = screen.getByText('Filter Easy');
    await userEvent.click(filterButton);

    // Should re-fetch with new filters
    expect(mockGetPublicRoutes).toHaveBeenCalledTimes(2);
  });

  it('should handle route selection', async () => {
    mockGetPublicRoutes.mockResolvedValue({
      success: true,
      data: mockRoutes,
      error: null,
    });

    render(<GalleryPage />);

    await waitFor(() => {
      expect(screen.getByTestId('route-route-1')).toBeInTheDocument();
    });

    const routeButton = screen.getByTestId('route-route-1');
    await userEvent.click(routeButton);

    // Should show route details or navigate (we'll implement this)
  });

  it('should work for both authenticated and unauthenticated users', async () => {
    mockGetPublicRoutes.mockResolvedValue({
      success: true,
      data: mockRoutes,
      error: null,
    });

    // Test unauthenticated user
    render(<GalleryPage />);
    
    await waitFor(() => {
      expect(screen.getByTestId('route-gallery-grid')).toBeInTheDocument();
    });

    // Test authenticated user
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
    });

    render(<GalleryPage />);
    
    await waitFor(() => {
      expect(screen.getByTestId('route-gallery-grid')).toBeInTheDocument();
    });
  });
});