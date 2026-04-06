
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import ImportsTab from "@/components/leads/imports/ImportsTab";
import { LeadImportHistory } from "@/components/leads/LeadImportHistory";
import { useToast } from "@/hooks/use-toast";

export const LeadImportExportTabs = () => {
  const { toast } = useToast();

  const handleImportSuccess = () => {
    toast({
      title: "Success",
      description: "Leads imported successfully",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="p-8 shadow-lg">
        <Tabs defaultValue="import" className="space-y-8">
          <TabsList className="w-full grid grid-cols-2 gap-4 p-2">
            <TabsTrigger value="import" className="py-4 text-lg">
              Import Leads
            </TabsTrigger>
            <TabsTrigger value="history" className="py-4 text-lg">
              Import History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="space-y-8">
            <div className="min-h-[700px]">
              <ImportsTab onSuccess={handleImportSuccess} />
            </div>
          </TabsContent>

          <TabsContent value="history">
            <div className="min-h-[700px]">
              <LeadImportHistory />
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};
