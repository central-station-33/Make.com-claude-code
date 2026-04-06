import { LeadWithProfile } from "@/types/dashboard";
import LeadAcquisitionChart from "./LeadAcquisitionChart";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardChartsProps {
  leads: LeadWithProfile[];
  isLoading?: boolean;
}

const DashboardCharts = ({ leads = [], isLoading = false }: DashboardChartsProps) => {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <Skeleton className="h-[300px] w-full" />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="p-6 hover:shadow-lg transition-all duration-200">
        <h3 className="text-lg font-semibold mb-4">Lead Acquisition Trends</h3>
        <LeadAcquisitionChart leads={leads} />
      </Card>
    </div>
  );
};

export default DashboardCharts;