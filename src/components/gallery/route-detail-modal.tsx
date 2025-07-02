/**
 * Route detail modal for previewing and copying routes from gallery
 */

'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { DatabaseRoute } from '@/types/database';
import { useAuth } from '@/contexts/auth-context';
import { copyRouteToUser } from '@/lib/database/route-copy';
import { RouteMap } from '@/components/ui/route-map';
import { ElevationChart } from '@/components/ui/elevation-chart';
import { formatDistance, formatElevationGain, formatDuration } from '@/lib/utils';

interface RouteDetailModalProps {
  route: DatabaseRoute;
  isOpen: boolean;
  onClose: () => void;
  onCopySuccess: (copiedRoute: DatabaseRoute) => void;
}

export function RouteDetailModal({
  route,
  isOpen,
  onClose,
  onCopySuccess,
}: RouteDetailModalProps) {
  const { user } = useAuth();
  const [copying, setCopying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isOwnRoute = user?.id === route.user_id;

  const handleCopy = async () => {
    if (!user || isOwnRoute) return;

    setCopying(true);
    setError(null);

    try {
      const result = await copyRouteToUser(route, user.id);
      
      if (result.success && result.data) {
        onCopySuccess(result.data);
      } else {
        setError(result.error?.message || 'Failed to copy route');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setCopying(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatCreatedDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
      data-testid="modal-backdrop"
    >
      <div
        className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        data-testid="route-detail-modal"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{route.name}</h2>
            <p className="text-gray-600 mt-1">
              Created {formatCreatedDate(route.created_at)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Route Stats */}
        <div className="p-6 border-b">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatDistance(route.route_data.distance * 1000)}
              </div>
              <div className="text-sm text-gray-600">Distance</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatElevationGain(route.route_data.elevationGain)}
              </div>
              <div className="text-sm text-gray-600">Elevation Gain</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {route.route_data.difficulty.charAt(0).toUpperCase() + route.route_data.difficulty.slice(1)}
              </div>
              <div className="text-sm text-gray-600">Difficulty</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatDuration(route.route_data.estimatedTime)}
              </div>
              <div className="text-sm text-gray-600">Est. Time</div>
            </div>
          </div>
        </div>

        {/* Tags */}
        {route.tags && route.tags.length > 0 && (
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {route.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Map and Elevation Chart */}
        <div className="p-6 space-y-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Route Map</h3>
            <div className="h-96 rounded-lg overflow-hidden border">
              <RouteMap points={route.route_data.points} />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Elevation Profile</h3>
            <div className="h-110 rounded-lg overflow-hidden border">
              <ElevationChart points={route.route_data.points} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t bg-gray-50">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
              {error}
            </div>
          )}
          
          <div className="flex justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Close
            </button>
            
            <div>
              {!user ? (
                <div className="px-4 py-2 text-gray-600">
                  Sign in to copy routes
                </div>
              ) : isOwnRoute ? (
                <div className="px-4 py-2 text-gray-600">
                  This is your route
                </div>
              ) : (
                <button
                  onClick={handleCopy}
                  disabled={copying}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {copying ? 'Copying...' : 'Copy to My Routes'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}