
import { useCRMStats } from "@/hooks/useCRMStats";
import { useCRMTasks } from "@/hooks/useCRMTasks";
import TaskList from "./crm/TaskList";
import ContactList from "./crm/ContactList";
import ActivityTimeline from "./crm/ActivityTimeline";
import DashboardStats from "./crm/DashboardStats";
import ContactStageChart from "./crm/ContactStageChart";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SalesFunnelView } from "@/components/sales/SalesFunnelView";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Users, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CRMDashboard = () => {
  const { data: stats, isLoading, error } = useCRMStats();
  const { tasks, handleTaskComplete } = useCRMTasks();
  const { toast } = useToast();

  console.log("CRM Stats:", { stats, isLoading, error });
  console.log("CRM Tasks:", tasks);

  const handleAutomateFollowUps = () => {
    toast({
      title: "Follow-ups Automated",
      description: "Follow-up schedule has been optimized based on contact engagement.",
    });
  };

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-red-500">Error loading CRM data: {error.message}</div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
        <div className="flex items-center space-x-4">
          <img 
            src="/lovable-uploads/9426cd2c-3e5d-46c0-8df6-12e24c277730.png" 
            alt="JRA Logo" 
            className="h-12 w-auto"
          />
          <div>
            <CardTitle>Central Station</CardTitle>
            <p className="text-sm text-muted-foreground">CRM Dashboard</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleAutomateFollowUps}>
            <Calendar className="w-4 h-4 mr-2" />
            Automate Follow-ups
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Contact
          </Button>
        </div>
      </CardHeader>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="funnel">Sales Funnel</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <DashboardStats
            leads={stats?.leads || []}
            isLoading={isLoading}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ContactStageChart data={stats?.stageData || []} />
            <ActivityTimeline />
          </div>
        </TabsContent>

        <TabsContent value="contacts">
          <ContactList 
            contacts={stats?.leads || []} 
          />
        </TabsContent>

        <TabsContent value="activities">
          <TaskList 
            tasks={tasks} 
            onComplete={handleTaskComplete} 
          />
        </TabsContent>

        <TabsContent value="funnel">
          <SalesFunnelView />
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default CRMDashboard;
