/**
 * Dashboard layout component
 */

import { Header } from '@/components/layouts/header';
import { STYLES } from '@/constants/styles';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className={`${STYLES.CONTAINER} py-8`}>
        {children}
      </main>
    </div>
  );
}