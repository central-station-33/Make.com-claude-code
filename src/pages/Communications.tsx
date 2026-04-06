import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmailConfigList from "@/components/crm/EmailConfigList";
import { LeadMessaging } from "@/components/leads/messaging/LeadMessaging";
import { useLeadsQuery } from "@/hooks/queries/useLeadsQuery";

const Communications = () => {
  const { data: leads, isLoading } = useLeadsQuery();
  const activeLead = leads?.[0]; // Get first lead if available

  return (
    <Tabs defaultValue="email" className="w-full">
      <TabsList>
        <TabsTrigger value="email">Email Configuration</TabsTrigger>
        <TabsTrigger value="messages">Messages</TabsTrigger>
      </TabsList>
      
      <TabsContent value="email">
        <EmailConfigList />
      </TabsContent>
      <TabsContent value="messages">
        {activeLead ? (
          <LeadMessaging leadId={activeLead.id} />
        ) : (
          <div className="text-center py-8 text-gray-500">
            {isLoading ? "Loading leads..." : "No leads available"}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};

export default Communications;