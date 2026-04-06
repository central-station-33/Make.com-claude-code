import UnassignedLeadsTable from '@/components/dashboard/UnassignedLeadsTable';
import { TabContentProps } from '../types/dashboard';

export const UnassignedTab = ({
  leads,
  isLoading
}: Pick<TabContentProps, 'leads' | 'isLoading'>) => {
  return (
    <div className="space-y-4">
      <UnassignedLeadsTable 
        leads={leads} 
        onAssigned={() => window.location.reload()} 
      />
    </div>
  );
};