
import { Card } from "@/components/ui/card";
import { useLeadStats } from "@/hooks/useLeadStats";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, UserCheck, DollarSign, Building } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const DashboardStats = () => {
  const { data: stats, isLoading, error } = useLeadStats();

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load dashboard statistics. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-10 w-[100px]" />
            <Skeleton className="h-4 w-[70px] mt-4" />
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "New Leads",
      value: stats?.find(s => s.status === 'New')?.count || 0,
      icon: Users,
      color: "text-blue-500",
    },
    {
      title: "Qualified Leads",
      value: stats?.find(s => s.status === 'Qualified')?.count || 0,
      icon: UserCheck,
      color: "text-green-500",
    },
    {
      title: "Active Deals",
      value: stats?.find(s => s.status === 'Negotiating')?.count || 0,
      icon: Building,
      color: "text-orange-500",
    },
    {
      title: "Closed Deals",
      value: stats?.find(s => s.status === 'Closed')?.count || 0,
      icon: DollarSign,
      color: "text-purple-500",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {statCards.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <Card key={idx} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </p>
                <h3 className="text-2xl font-bold mt-2">{stat.value}</h3>
              </div>
              <Icon className={`h-8 w-8 ${stat.color}`} />
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default DashboardStats;
