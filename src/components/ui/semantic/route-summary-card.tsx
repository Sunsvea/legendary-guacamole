import { Route } from '@/types/route';
import { PathfindingOptions } from '@/types/pathfinding';
import { DatabaseRoute } from '@/types/database';
import { UI_TEXT } from '@/constants/ui-text';
import { STYLES } from '@/constants/styles';
import { SaveRouteButton } from './save-route-button';

interface RouteSummaryCardProps {
  route: Route;
  pathfindingOptions?: PathfindingOptions;
  onSaveSuccess?: (savedRoute: DatabaseRoute) => void;
  onAuthRequired?: () => void;
  className?: string;
}

interface MetricItemProps {
  value: string | number;
  unit: string;
  label: string;
  colorClass: string;
}

function MetricItem({ value, unit, label, colorClass }: MetricItemProps) {
  return (
    <div className={STYLES.TEXT_CENTER}>
      <div className={`${STYLES.METRIC_VALUE} ${colorClass}`}>
        {value}{unit}
      </div>
      <div className={STYLES.METRIC_LABEL}>{label}</div>
    </div>
  );
}

export function RouteSummaryCard({ 
  route, 
  pathfindingOptions, 
  onSaveSuccess, 
  onAuthRequired, 
  className 
}: RouteSummaryCardProps) {
  return (
    <div className={`${STYLES.CARD} ${className || ''}`}>
      {/* Header with Save Button */}
      <div className={`${STYLES.FLEX_BETWEEN} mb-4`}>
        <h3 className={STYLES.HEADING_XL}>{UI_TEXT.ROUTE_SUMMARY}</h3>
        {pathfindingOptions && (
          <SaveRouteButton 
            route={route}
            pathfindingOptions={pathfindingOptions}
            onSaveSuccess={onSaveSuccess}
            onAuthRequired={onAuthRequired}
            variant="secondary"
          />
        )}
      </div>
      
      {/* Metrics Grid */}
      <div className={STYLES.GRID_2_MD_4}>
        <MetricItem 
          value={route.distance}
          unit={UI_TEXT.UNIT_KM}
          label={UI_TEXT.DISTANCE}
          colorClass={STYLES.COLOR_BLUE}
        />
        <MetricItem 
          value={route.elevationGain}
          unit={UI_TEXT.UNIT_M}
          label={UI_TEXT.ELEVATION_GAIN}
          colorClass={STYLES.COLOR_GREEN}
        />
        <MetricItem 
          value={route.difficulty}
          unit=""
          label={UI_TEXT.DIFFICULTY}
          colorClass={`${STYLES.COLOR_ORANGE} capitalize`}
        />
        <MetricItem 
          value={route.estimatedTime}
          unit={UI_TEXT.UNIT_H}
          label={UI_TEXT.ESTIMATED_TIME}
          colorClass={STYLES.COLOR_PURPLE}
        />
      </div>
    </div>
  );
}