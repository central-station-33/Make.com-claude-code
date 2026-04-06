import { Lead, LeadStatus, LeadType } from "@/types/lead";
import { Users, UserCheck, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import StatsCard from "./StatsCard";

interface LeadStatsProps {
  leads: Lead[];
}

const LeadStats = ({ leads }: LeadStatsProps) => {
  const stats = {
    total: leads.length,
    buyers: leads.filter((l) => l.type === LeadType.BUYER).length,
    sellers: leads.filter((l) => l.type === LeadType.SELLER).length,
    investors: leads.filter((l) => l.type === LeadType.INVESTOR).length,
    totalPotentialValue: leads.reduce((sum, lead) => sum + (lead.budget || 0), 0),
    activeDeals: leads.filter((l) => l.status === LeadStatus.NEGOTIATING).length,
  };

  return (
    <>
      <StatsCard
        title="Total Leads"
        value={stats.total}
        subtitle={`${stats.buyers} buyers, ${stats.sellers} sellers, ${stats.investors} investors`}
        icon={Users}
        iconColor="text-blue-500"
      />
      <StatsCard
        title="Active Deals"
        value={stats.activeDeals}
        icon={UserCheck}
        iconColor="text-orange-500"
      />
      <StatsCard
        title="Potential Value"
        value={formatCurrency(stats.totalPotentialValue)}
        icon={DollarSign}
        iconColor="text-green-500"
      />
    </>
  );
};

export default LeadStats;