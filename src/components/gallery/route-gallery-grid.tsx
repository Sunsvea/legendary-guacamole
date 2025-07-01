/**
 * Route gallery grid component
 */

import { MapPin, TrendingUp, Clock, Mountain, Calendar } from 'lucide-react';
import { DatabaseRoute } from '@/types/database';
import { STYLES } from '@/constants/styles';

interface RouteGalleryGridProps {
  routes: DatabaseRoute[];
  onRouteSelect: (route: DatabaseRoute) => void;
}

interface MetricProps {
  icon: React.ReactNode;
  value: string;
  label: string;
}

function Metric({ icon, value, label }: MetricProps) {
  return (
    <div className={`${STYLES.FLEX_ITEMS_CENTER} text-sm text-gray-600`}>
      {icon}
      <span className="ml-1 font-medium text-gray-900">{value}</span>
      <span className="ml-1">{label}</span>
    </div>
  );
}

function RouteGalleryCard({ route, onSelect }: { route: DatabaseRoute; onSelect: (route: DatabaseRoute) => void }) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'moderate': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-orange-600 bg-orange-100';
      case 'extreme': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (seconds: number) => {
    return (seconds / 3600).toFixed(1);
  };

  return (
    <div 
      className={`${STYLES.CARD} hover:shadow-lg transition-shadow cursor-pointer`}
      onClick={() => onSelect(route)}
      data-testid={`route-card-${route.id}`}
    >
      {/* Header */}
      <div className="mb-4">
        <h3 className={`${STYLES.HEADING_LG} truncate text-gray-900 mb-2`}>
          {route.name}
        </h3>
        <div className={`${STYLES.FLEX_ITEMS_CENTER} text-sm text-gray-500`}>
          <Calendar className={`${STYLES.ICON_XS} mr-1`} />
          {formatDate(route.created_at)}
        </div>
      </div>

      {/* Route Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Metric
          icon={<MapPin className={`${STYLES.ICON_XS} text-blue-500`} />}
          value={route.route_data.distance.toFixed(1)}
          label="km"
        />
        <Metric
          icon={<TrendingUp className={`${STYLES.ICON_XS} text-green-500`} />}
          value={route.route_data.elevationGain.toFixed(0)}
          label="m"
        />
        <Metric
          icon={<Clock className={`${STYLES.ICON_XS} text-purple-500`} />}
          value={formatTime(route.route_data.estimatedTime)}
          label="hrs"
        />
        <Metric
          icon={<Mountain className={`${STYLES.ICON_XS} text-orange-500`} />}
          value={route.route_data.difficulty}
          label=""
        />
      </div>

      {/* Status and Tags */}
      <div className="flex flex-wrap gap-2">
        <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getDifficultyColor(route.route_data.difficulty)}`}>
          {route.route_data.difficulty}
        </span>
        
        {route.tags.slice(0, 3).map(tag => (
          <span
            key={tag}
            className="px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded"
          >
            {tag}
          </span>
        ))}
        
        {route.tags.length > 3 && (
          <span className="px-2 py-1 text-xs text-gray-500 bg-gray-50 rounded">
            +{route.tags.length - 3} more
          </span>
        )}
      </div>
    </div>
  );
}

export function RouteGalleryGrid({ routes, onRouteSelect }: RouteGalleryGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" data-testid="route-gallery-grid">
      {routes.map(route => (
        <RouteGalleryCard
          key={route.id}
          route={route}
          onSelect={onRouteSelect}
        />
      ))}
    </div>
  );
}