
import { useSalesFunnel } from "@/hooks/useSalesFunnel";
import { SalesFunnelView } from "@/components/sales/SalesFunnelView";
import LeadList from "@/components/LeadList";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const SalesFunnel = () => {
  const { isLoading, error } = useSalesFunnel();

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-500">
          Error loading sales funnel data: {error.message}
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Sales Funnel</h2>
          <p className="text-muted-foreground">
            Track your lead conversion through the sales pipeline
          </p>
        </div>
      </div>
      
      <SalesFunnelView />
      
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Lead Details</h3>
        <LeadList />
      </div>
    </div>
  );
};

export default SalesFunnel;
