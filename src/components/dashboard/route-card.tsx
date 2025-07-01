/**
 * Individual route card component for dashboard
 */

import { useState } from 'react';
import { 
  MoreVertical, 
  Trash2, 
  Eye, 
  EyeOff, 
  MapPin, 
  TrendingUp,
  Clock,
  Mountain
} from 'lucide-react';
import { DatabaseRoute } from '@/types/database';
import { deleteRoute, updateRoute } from '@/lib/database/routes';
import { useAuth } from '@/contexts/auth-context';
import { STYLES } from '@/constants/styles';

interface RouteCardProps {
  route: DatabaseRoute;
  onDelete: (routeId: string) => void;
  onUpdate: (route: DatabaseRoute) => void;
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

export function RouteCard({ route, onDelete, onUpdate }: RouteCardProps) {
  const { user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!user || !confirm('Are you sure you want to delete this route?')) return;

    setLoading(true);
    try {
      const result = await deleteRoute(route.id, user.id);
      if (result.success) {
        onDelete(route.id);
      } else {
        alert('Failed to delete route: ' + (result.error?.message || 'Unknown error'));
      }
    } catch {
      alert('Failed to delete route');
    } finally {
      setLoading(false);
      setShowMenu(false);
    }
  };

  const handleToggleVisibility = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const result = await updateRoute(
        route.id,
        user.id,
        route.route_data,
        route.pathfinding_options,
        !route.is_public,
        route.tags
      );
      
      if (result.success && result.data) {
        onUpdate(result.data);
      } else {
        alert('Failed to update route visibility: ' + (result.error?.message || 'Unknown error'));
      }
    } catch {
      alert('Failed to update route visibility');
    } finally {
      setLoading(false);
      setShowMenu(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'moderate': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-orange-600 bg-orange-100';
      case 'extreme': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className={`${STYLES.CARD} hover:shadow-lg transition-shadow relative`}>
      {/* Header */}
      <div className={`${STYLES.FLEX_BETWEEN} mb-4`}>
        <div className="flex-1 min-w-0">
          <h3 className={`${STYLES.HEADING_LG} truncate text-gray-900`}>
            {route.name}
          </h3>
          <p className={`${STYLES.TEXT_SM_GRAY} mt-1`}>
            Created {formatDate(route.created_at)}
          </p>
        </div>
        
        {/* Menu Button */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <MoreVertical className={STYLES.ICON_SM} />
          </button>
          
          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg ring-1 ring-gray-200 z-10">
              <div className="py-1">
                <button
                  onClick={handleToggleVisibility}
                  disabled={loading}
                  className={`${STYLES.FLEX_ITEMS_CENTER} w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100`}
                >
                  {route.is_public ? (
                    <>
                      <EyeOff className={`${STYLES.ICON_SM} mr-3`} />
                      Make Private
                    </>
                  ) : (
                    <>
                      <Eye className={`${STYLES.ICON_SM} mr-3`} />
                      Make Public
                    </>
                  )}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className={`${STYLES.FLEX_ITEMS_CENTER} w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50`}
                >
                  <Trash2 className={`${STYLES.ICON_SM} mr-3`} />
                  Delete Route
                </button>
              </div>
            </div>
          )}
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
          value={(route.route_data.estimatedTime / 3600).toFixed(1)}
          label="hrs"
        />
        <Metric
          icon={<Mountain className={`${STYLES.ICON_XS} text-orange-500`} />}
          value={route.route_data.difficulty}
          label=""
        />
      </div>

      {/* Status Badges */}
      <div className={`${STYLES.FLEX_BETWEEN} items-end`}>
        <div className="flex space-x-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getDifficultyColor(route.route_data.difficulty)}`}>
            {route.route_data.difficulty}
          </span>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            route.is_public 
              ? 'text-blue-600 bg-blue-100' 
              : 'text-gray-600 bg-gray-100'
          }`}>
            {route.is_public ? 'Public' : 'Private'}
          </span>
        </div>

        {/* Tags */}
        {route.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {route.tags.slice(0, 2).map(tag => (
              <span
                key={tag}
                className="px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded"
              >
                {tag}
              </span>
            ))}
            {route.tags.length > 2 && (
              <span className="px-2 py-1 text-xs text-gray-500 bg-gray-50 rounded">
                +{route.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Click Overlay for Menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
}