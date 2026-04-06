import { Card } from "@/components/ui/card";
import { LeadWithProfile } from "@/types/dashboard";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStatsProps {
  leads: LeadWithProfile[];
  isLoading: boolean;
}

const DashboardStats = ({ leads, isLoading }: DashboardStatsProps) => {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-7 w-[100px] mb-4" />
            <Skeleton className="h-4 w-[60px]" />
          </Card>
        ))}
      </div>
    );
  }

  const totalLeads = leads.length;
  const activeLeads = leads.filter(l => l.status !== 'Lost' && l.status !== 'Closed').length;
  const qualifiedLeads = leads.filter(l => l.status === 'Qualified').length;
  const conversionRate = totalLeads ? (leads.filter(l => l.status === 'Closed').length / totalLeads) * 100 : 0;

  const stats = [
    {
      title: "Total Leads",
      value: totalLeads,
    },
    {
      title: "Active Leads",
      value: activeLeads,
    },
    {
      title: "Qualified Leads",
      value: qualifiedLeads,
    },
    {
      title: "Conversion Rate",
      value: `${conversionRate.toFixed(1)}%`,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">{stat.title}</h3>
          <p className="text-2xl font-bold">{stat.value}</p>
        </Card>
      ))}
    </div>
  );
};

export default DashboardStats;