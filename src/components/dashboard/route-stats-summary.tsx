/**
 * Route statistics summary component
 */

import { DatabaseRoute } from '@/types/database';
import { STYLES } from '@/constants/styles';

interface RouteStatsSummaryProps {
  routes: DatabaseRoute[];
}

interface StatItemProps {
  value: string | number;
  label: string;
  colorClass: string;
}

function StatItem({ value, label, colorClass }: StatItemProps) {
  return (
    <div className={STYLES.TEXT_CENTER}>
      <div className={`${STYLES.METRIC_VALUE} ${colorClass}`}>
        {value}
      </div>
      <div className={STYLES.METRIC_LABEL}>{label}</div>
    </div>
  );
}

export function RouteStatsummary({ routes }: RouteStatsSummaryProps) {
  // Calculate statistics
  const totalRoutes = routes.length;
  const publicRoutes = routes.filter(route => route.is_public).length;
  const totalDistance = routes.reduce((sum, route) => sum + route.route_data.distance, 0);
  const totalElevation = routes.reduce((sum, route) => sum + route.route_data.elevationGain, 0);

  return (
    <div className={STYLES.CARD}>
      <h3 className={`${STYLES.HEADING_LG} mb-4`}>Route Statistics</h3>
      
      <div className={STYLES.SPACE_Y_4}>
        <StatItem 
          value={totalRoutes}
          label="Total Routes"
          colorClass={STYLES.COLOR_BLUE}
        />
        <StatItem 
          value={publicRoutes}
          label="Public Routes"
          colorClass={STYLES.COLOR_GREEN}
        />
        <StatItem 
          value={`${totalDistance.toFixed(1)} km`}
          label="Total Distance"
          colorClass={STYLES.COLOR_ORANGE}
        />
        <StatItem 
          value={`${totalElevation.toFixed(0)} m`}
          label="Total Elevation"
          colorClass={STYLES.COLOR_PURPLE}
        />
      </div>
    </div>
  );
}