
import { useSalesFunnel } from "@/hooks/useSalesFunnel";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

export const SalesFunnelView = () => {
  const { stats, isLoading, error } = useSalesFunnel();

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-500">
          Error loading sales funnel: {error.message}
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Sales Funnel Overview</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span>Total Leads</span>
              <span>{stats.totalLeads}</span>
            </div>
            <Progress value={(stats.totalLeads / 100) * 100} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span>Proposals Sent</span>
              <span>{stats.proposalsSent}</span>
            </div>
            <Progress 
              value={(stats.proposalsSent / stats.totalLeads) * 100} 
              className="h-2" 
            />
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span>In Negotiation</span>
              <span>{stats.inNegotiation}</span>
            </div>
            <Progress 
              value={(stats.inNegotiation / stats.totalLeads) * 100} 
              className="h-2" 
            />
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span>Closed Deals</span>
              <span>{stats.closedDeals}</span>
            </div>
            <Progress 
              value={(stats.closedDeals / stats.totalLeads) * 100} 
              className="h-2" 
            />
          </div>
        </div>
      </Card>
    </div>
  );
};
