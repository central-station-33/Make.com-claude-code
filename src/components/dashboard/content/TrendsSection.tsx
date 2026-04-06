import { FC } from 'react';
import { LeadWithProfile } from '@/types/dashboard';
import ErrorBoundary from '@/components/ErrorBoundary';
import DashboardCharts from '../DashboardCharts';

interface TrendsSectionProps {
  leads: LeadWithProfile[];
  isLoading: boolean;
}

const TrendsSection: FC<TrendsSectionProps> = ({ leads, isLoading }) => {
  return (
    <ErrorBoundary>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Lead Acquisition Trends
        </h2>
        <DashboardCharts leads={leads} isLoading={isLoading} />
      </div>
    </ErrorBoundary>
  );
};

export default TrendsSection;