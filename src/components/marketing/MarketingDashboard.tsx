import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MaterialGrid } from "./MaterialGrid";
import { useMarketingMaterials } from "./hooks/useMarketingMaterials";
import { DashboardHeader } from "./components/DashboardHeader";
import { DashboardStats } from "./components/DashboardStats";
import { PerformanceChart } from "./components/PerformanceChart";
import MaterialList from "./MaterialList";
import { useToast } from "@/hooks/use-toast";

const MarketingDashboard = () => {
  const { toast } = useToast();
  const { materials, isLoading, filters, setFilters, stats } = useMarketingMaterials({
    category: null,
    isPremium: false,
    search: '',
    sort: 'newest',
    viewMode: 'grid'
  });

  const handleFavoriteToggle = (id: string) => {
    toast({
      title: "Updated",
      description: "Material favorite status updated",
    });
  };

  const performanceData = [
    { date: 'Mon', views: 120, conversions: 15 },
    { date: 'Tue', views: 150, conversions: 20 },
    { date: 'Wed', views: 180, conversions: 25 },
    { date: 'Thu', views: 190, conversions: 30 },
    { date: 'Fri', views: 220, conversions: 35 },
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center space-x-4 mb-6">
        <img 
          src="/uploads/9426cd2c-3e5d-46c0-8df6-12e24c277730.png" 
          alt="JRA Logo" 
          className="h-12 w-auto"
        />
        <div>
          <h1 className="text-2xl font-bold">Central Station</h1>
          <p className="text-sm text-muted-foreground">Marketing Dashboard</p>
        </div>
      </div>

      <DashboardHeader />
      <DashboardStats />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <PerformanceChart data={performanceData} />
        </TabsContent>

        <TabsContent value="materials">
          <MaterialList 
            materials={materials} 
            viewMode={filters.viewMode}
            isLoading={isLoading}
            onFavoriteToggle={handleFavoriteToggle}
          />
        </TabsContent>

        <TabsContent value="campaigns">
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">Active Campaigns</h3>
            <div className="text-sm text-muted-foreground">
              Campaign management features coming soon
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">Marketing Analytics</h3>
            <div className="text-sm text-muted-foreground">
              Detailed analytics features coming soon
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default MarketingDashboard;