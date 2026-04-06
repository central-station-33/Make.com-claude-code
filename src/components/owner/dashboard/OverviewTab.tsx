
import { LeadWithProfile } from "@/types/dashboard";
import { SalesFunnelView } from "@/components/sales/SalesFunnelView";

interface OverviewTabProps {
  leads: LeadWithProfile[];
  isLoading: boolean;
}

const OverviewTab = ({ leads, isLoading }: OverviewTabProps) => {
  // Ensure leads is an array before mapping
  const leadArray = Array.isArray(leads) ? leads : [];

  return (
    <div className="space-y-8">
      <SalesFunnelView />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          <p>Loading...</p>
        ) : leadArray.length === 0 ? (
          <p>No leads found</p>
        ) : (
          leadArray.map(lead => (
            <div key={lead.id} className="p-4 border rounded-lg">
              <h3 className="font-medium">{lead.name}</h3>
              <p>Email: {lead.email}</p>
              <p>Status: {lead.status}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OverviewTab;
