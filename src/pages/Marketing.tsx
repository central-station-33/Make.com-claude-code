import { Card } from "@/components/ui/card";
import { MarketingExpress } from "@/components/marketing/MarketingExpress";
import { ManageMarketingMaterials } from "@/components/marketing/ManageMarketingMaterials";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Settings } from "lucide-react";
import { BackButton } from "@/components/BackButton";

const Marketing = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <BackButton to="/dashboard" />
        <h1 className="text-3xl font-bold">Marketing</h1>
      </div>

      <Card className="p-6">
        <Tabs defaultValue="materials" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="materials" className="flex items-center gap-2 flex-1">
              <FileText className="h-4 w-4" />
              Marketing Materials
            </TabsTrigger>
            <TabsTrigger value="manage" className="flex items-center gap-2 flex-1">
              <Settings className="h-4 w-4" />
              Manage Materials
            </TabsTrigger>
          </TabsList>

          <TabsContent value="materials" className="mt-4">
            <MarketingExpress />
          </TabsContent>

          <TabsContent value="manage" className="mt-4">
            <ManageMarketingMaterials />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Marketing;