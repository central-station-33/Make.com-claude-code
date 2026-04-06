import { Lead, LeadStatus, LeadType } from "@/types/lead";
import { Users, UserCheck, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import LeadStatsCard from "./LeadStatsCard";

interface LeadStatsGridProps {
  leads: Lead[];
}

const LeadStatsGrid = ({ leads }: LeadStatsGridProps) => {
  const stats = {
    total: leads.length,
    buyers: leads.filter((l) => l.type === LeadType.BUYER).length,
    sellers: leads.filter((l) => l.type === LeadType.SELLER).length,
    investors: leads.filter((l) => l.type === LeadType.INVESTOR).length,
    totalPotentialValue: leads.reduce((sum, lead) => sum + (lead.budget || 0), 0),
    activeDeals: leads.filter((l) => l.status === LeadStatus.NEGOTIATING).length,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <LeadStatsCard
        title="Total Leads"
        value={stats.total}
        subtitle={`${stats.buyers} buyers, ${stats.sellers} sellers, ${stats.investors} investors`}
        icon={Users}
        iconColor="text-blue-500"
      />
      <LeadStatsCard
        title="Active Deals"
        value={stats.activeDeals}
        icon={UserCheck}
        iconColor="text-orange-500"
      />
      <LeadStatsCard
        title="Potential Value"
        value={formatCurrency(stats.totalPotentialValue)}
        icon={DollarSign}
        iconColor="text-green-500"
      />
    </div>
  );
};

export default LeadStatsGrid;