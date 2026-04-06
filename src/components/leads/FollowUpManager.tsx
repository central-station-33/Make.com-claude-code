import { useState } from "react";
import { FollowUpScheduler } from "./FollowUpScheduler";
import { FollowUpTimeline } from "./FollowUpTimeline";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";

interface FollowUpManagerProps {
  leadId: string;
}

export const FollowUpManager = ({ leadId }: FollowUpManagerProps) => {
  const [activeTab, setActiveTab] = useState("timeline");

  return (
    <Card className="p-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="schedule">Schedule Follow-up</TabsTrigger>
        </TabsList>
        <TabsContent value="timeline">
          <FollowUpTimeline leadId={leadId} />
        </TabsContent>
        <TabsContent value="schedule">
          <FollowUpScheduler leadId={leadId} />
        </TabsContent>
      </Tabs>
    </Card>
  );
};