import { Card } from "@/components/ui/card";
import { Lead, LeadStatus, LeadType } from "@/types/lead";
import { formatCurrency } from "@/lib/utils";
import { Users, UserCheck, DollarSign } from "lucide-react";

const LeadStats = ({ leads }: { leads: Lead[] }) => {
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
      <Card className="p-6">
        <div className="flex items-center space-x-3">
          <Users className="h-5 w-5 text-blue-500" />
          <div>
            <h3 className="text-sm font-medium text-gray-500">Total Leads</h3>
            <p className="mt-2 text-3xl font-semibold text-primary">{stats.total}</p>
            <div className="mt-2 text-sm text-gray-600">
              {stats.buyers} buyers, {stats.sellers} sellers, {stats.investors} investors
            </div>
          </div>
        </div>
      </Card>
      <Card className="p-6">
        <div className="flex items-center space-x-3">
          <UserCheck className="h-5 w-5 text-orange-500" />
          <div>
            <h3 className="text-sm font-medium text-gray-500">Active Deals</h3>
            <p className="mt-2 text-3xl font-semibold text-orange-500">{stats.activeDeals}</p>
          </div>
        </div>
      </Card>
      <Card className="p-6">
        <div className="flex items-center space-x-3">
          <DollarSign className="h-5 w-5 text-green-500" />
          <div>
            <h3 className="text-sm font-medium text-gray-500">Potential Value</h3>
            <p className="mt-2 text-3xl font-semibold text-success">
              {formatCurrency(stats.totalPotentialValue)}
            </p>
          </div>
        </div>
      </Card>
    </>
  );
};

export default LeadStats;