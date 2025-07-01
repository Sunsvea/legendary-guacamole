/**
 * Empty state component for route dashboard
 */

import Link from 'next/link';
import { Mountain, Search, Plus } from 'lucide-react';
import { STYLES } from '@/constants/styles';

interface RouteEmptyStateProps {
  hasRoutes: boolean;
  searchQuery: string;
}

export function RouteEmptyState({ hasRoutes, searchQuery }: RouteEmptyStateProps) {
  if (!hasRoutes) {
    // No routes at all - first time user
    return (
      <div className={`${STYLES.CARD} ${STYLES.TEXT_CENTER} py-12`}>
        <Mountain className={`${STYLES.ICON_2XL} text-gray-400 mx-auto mb-4`} />
        <h3 className={`${STYLES.HEADING_XL} mb-2`}>No Routes Yet</h3>
        <p className={`${STYLES.TEXT_SM_GRAY} mb-6`}>
          Start by creating your first alpine route using our route optimizer.
        </p>
        <Link
          href="/"
          className={`${STYLES.BTN_PRIMARY} ${STYLES.FLEX_ITEMS_CENTER} inline-flex`}
        >
          <Plus className={`${STYLES.ICON_SM} mr-2`} />
          Create Your First Route
        </Link>
      </div>
    );
  }

  if (searchQuery) {
    // Has routes but search returned no results
    return (
      <div className={`${STYLES.CARD} ${STYLES.TEXT_CENTER} py-12`}>
        <Search className={`${STYLES.ICON_2XL} text-gray-400 mx-auto mb-4`} />
        <h3 className={`${STYLES.HEADING_XL} mb-2`}>No Routes Found</h3>
        <p className={`${STYLES.TEXT_SM_GRAY} mb-4`}>
          No routes match your search criteria &ldquo;{searchQuery}&rdquo;.
        </p>
        <p className={STYLES.TEXT_SM_GRAY}>
          Try adjusting your filters or search terms.
        </p>
      </div>
    );
  }

  // Has routes but filters exclude all results
  return (
    <div className={`${STYLES.CARD} ${STYLES.TEXT_CENTER} py-12`}>
      <Search className={`${STYLES.ICON_2XL} text-gray-400 mx-auto mb-4`} />
      <h3 className={`${STYLES.HEADING_XL} mb-2`}>No Matching Routes</h3>
      <p className={`${STYLES.TEXT_SM_GRAY} mb-4`}>
        No routes match your current filters.
      </p>
      <p className={STYLES.TEXT_SM_GRAY}>
        Try adjusting your filter settings to see more routes.
      </p>
    </div>
  );
}