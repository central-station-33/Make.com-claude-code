import { Users, ArrowUp, ChartBar } from "lucide-react";
import StatsCard from "../../dashboard/StatsCard";

export const DashboardStats = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <StatsCard
        title="Total Views"
        value="1,234"
        description="+12% from last month"
        icon={<Users className="w-4 h-4" />}
      />
      <StatsCard
        title="Conversion Rate"
        value="8.5%"
        description="+2.5% from last month"
        icon={<ArrowUp className="w-4 h-4" />}
      />
      <StatsCard
        title="Active Campaigns"
        value="5"
        description="2 ending soon"
        icon={<ChartBar className="w-4 h-4" />}
      />
    </div>
  );
};