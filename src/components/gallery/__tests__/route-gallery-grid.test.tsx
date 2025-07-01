/**
 * Tests for route gallery grid component
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouteGalleryGrid } from '../route-gallery-grid';
import { DatabaseRoute } from '@/types/database';

const mockRoutes: DatabaseRoute[] = [
  {
    id: 'route-1',
    user_id: 'user-1',
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
  },
  {
    id: 'route-2',
    user_id: 'user-2', 
    name: 'Summit Challenge',
    route_data: {
      id: 'route-2',
      name: 'Summit Challenge',
      start: { lat: 46.5000, lng: 7.5000, elevation: 1200 },
      end: { lat: 46.5100, lng: 7.5100, elevation: 2000 },
      points: [],
      distance: 8.1,
      elevationGain: 1200,
      difficulty: 'hard',
      estimatedTime: 10800,
      createdAt: new Date('2025-01-02T10:00:00Z')
    },
    pathfinding_options: {
      trailWeight: 0.8,
      elevationWeight: 0.2,
      difficultyPreference: 'hard',
      avoidSteepTerrain: false,
      preferScenicRoutes: false,
      maxDetourFactor: 1.2,
      safetyBuffer: 50
    },
    is_public: true,
    tags: ['summit', 'challenging'],
    created_at: '2025-01-02T10:00:00Z',
    updated_at: '2025-01-02T10:00:00Z'
  }
];

describe('RouteGalleryGrid', () => {
  const mockOnRouteSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render route cards in a grid layout', () => {
    render(
      <RouteGalleryGrid 
        routes={mockRoutes} 
        onRouteSelect={mockOnRouteSelect}
      />
    );

    expect(screen.getByText('Alpine Adventure')).toBeInTheDocument();
    expect(screen.getByText('Summit Challenge')).toBeInTheDocument();
    
    // Should show route metrics
    expect(screen.getByText('5.2')).toBeInTheDocument();
    expect(screen.getByText('800')).toBeInTheDocument();
    expect(screen.getByText('8.1')).toBeInTheDocument();
    expect(screen.getByText('1200')).toBeInTheDocument();
  });

  it('should handle route selection on card click', async () => {
    render(
      <RouteGalleryGrid 
        routes={mockRoutes} 
        onRouteSelect={mockOnRouteSelect}
      />
    );

    const routeCard = screen.getByTestId('route-card-route-1');
    await userEvent.click(routeCard);

    expect(mockOnRouteSelect).toHaveBeenCalledWith(mockRoutes[0]);
  });

  it('should display route difficulty with appropriate styling', () => {
    render(
      <RouteGalleryGrid 
        routes={mockRoutes} 
        onRouteSelect={mockOnRouteSelect}
      />
    );

    const moderateTag = screen.getAllByText('moderate').find(el => 
      el.classList.contains('text-yellow-600')
    );
    const hardTag = screen.getAllByText('hard').find(el => 
      el.classList.contains('text-orange-600')
    );

    expect(moderateTag).toHaveClass('text-yellow-600');
    expect(hardTag).toHaveClass('text-orange-600');
  });

  it('should display route tags', () => {
    render(
      <RouteGalleryGrid 
        routes={mockRoutes} 
        onRouteSelect={mockOnRouteSelect}
      />
    );

    expect(screen.getByText('hiking')).toBeInTheDocument();
    expect(screen.getAllByText('moderate').length).toBeGreaterThan(0);
    expect(screen.getByText('summit')).toBeInTheDocument();
    expect(screen.getByText('challenging')).toBeInTheDocument();
  });

  it('should handle empty routes array', () => {
    render(
      <RouteGalleryGrid 
        routes={[]} 
        onRouteSelect={mockOnRouteSelect}
      />
    );

    expect(screen.getByTestId('route-gallery-grid')).toBeInTheDocument();
    expect(screen.queryByText('Alpine Adventure')).not.toBeInTheDocument();
  });

  it('should format route creation date', () => {
    render(
      <RouteGalleryGrid 
        routes={mockRoutes} 
        onRouteSelect={mockOnRouteSelect}
      />
    );

    // Should show formatted dates
    expect(screen.getByText('Jan 1, 2025')).toBeInTheDocument();
    expect(screen.getByText('Jan 2, 2025')).toBeInTheDocument();
  });

  it('should display estimated time in hours', () => {
    render(
      <RouteGalleryGrid 
        routes={mockRoutes} 
        onRouteSelect={mockOnRouteSelect}
      />
    );

    expect(screen.getByText('2.0')).toBeInTheDocument(); // 7200 seconds
    expect(screen.getByText('3.0')).toBeInTheDocument(); // 10800 seconds
  });
});