import { FC } from 'react';
import { LeadWithProfile } from '@/types/dashboard';
import ErrorBoundary from '@/components/ErrorBoundary';
import LeadStatsGrid from '../stats/LeadStatsGrid';

interface LeadStatsSectionProps {
  leads: LeadWithProfile[];
}

const LeadStatsSection: FC<LeadStatsSectionProps> = ({ leads }) => {
  return (
    <ErrorBoundary>
      <div className="grid grid-cols-1 gap-6 mb-8">
        <LeadStatsGrid leads={leads} />
      </div>
    </ErrorBoundary>
  );
};

export default LeadStatsSection;