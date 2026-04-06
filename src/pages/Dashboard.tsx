
import { Suspense, memo } from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import DashboardContainer from '@/components/dashboard/DashboardContainer';
import DashboardLoading from '@/components/dashboard/states/DashboardLoading';
import DashboardError from '@/components/dashboard/states/DashboardError';

const DashboardPage = memo(() => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ErrorBoundary fallback={<DashboardError error={new Error("Something went wrong loading the dashboard")} />}>
        <Suspense fallback={<DashboardLoading />}>
          <DashboardContainer />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
});

DashboardPage.displayName = 'DashboardPage';

export default DashboardPage;
