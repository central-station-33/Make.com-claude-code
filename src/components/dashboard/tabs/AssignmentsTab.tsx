import LeadAssignments from '@/components/dashboard/LeadAssignments';
import { TabContentProps } from '../types/dashboard';

export const AssignmentsTab = ({
  leads
}: Pick<TabContentProps, 'leads'>) => {
  return (
    <div className="space-y-4">
      <LeadAssignments leads={leads} />
    </div>
  );
};