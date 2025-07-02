/**
 * Grid layout for displaying route cards
 */

import { DatabaseRoute } from '@/types/database';
import { RouteCard } from './route-card';

interface RouteGridProps {
  routes: DatabaseRoute[];
  onRouteDelete: (routeId: string) => void;
  onRouteUpdate: (route: DatabaseRoute) => void;
  onRouteSelect: (route: DatabaseRoute) => void;
}

export function RouteGrid({ routes, onRouteDelete, onRouteUpdate, onRouteSelect }: RouteGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {routes.map(route => (
        <RouteCard
          key={route.id}
          route={route}
          onDelete={onRouteDelete}
          onUpdate={onRouteUpdate}
          onRouteSelect={onRouteSelect}
        />
      ))}
    </div>
  );
}