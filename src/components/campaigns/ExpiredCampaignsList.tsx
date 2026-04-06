import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

interface Campaign {
  id: string;
  name: string;
  status: string;
  type: string;
  scheduled_for: string;
  sent_at: string;
}

const ExpiredCampaignsList = () => {
  const { data: campaigns, isLoading, error } = useQuery({
    queryKey: ["expired-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .or("scheduled_for.lt.now,sent_at.is.not.null")
        .order("scheduled_for", { ascending: false });

      if (error) throw error;
      return data as Campaign[];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-destructive p-4 rounded-md bg-destructive/10">
        Error loading campaigns: {(error as Error).message}
      </div>
    );
  }

  if (!campaigns?.length) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        No expired campaigns found
      </div>
    );
  }

  return (
    <ScrollArea className="h-[600px]">
      <div className="space-y-4 p-4">
        {campaigns.map((campaign) => (
          <Card key={campaign.id}>
            <CardHeader>
              <CardTitle className="text-lg">{campaign.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium">{campaign.type}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-medium">{campaign.status}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Scheduled for:</span>
                  <span className="font-medium">
                    {campaign.scheduled_for
                      ? format(new Date(campaign.scheduled_for), "PPp")
                      : "Not scheduled"}
                  </span>
                </div>
                {campaign.sent_at && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sent at:</span>
                    <span className="font-medium">
                      {format(new Date(campaign.sent_at), "PPp")}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
};

export default ExpiredCampaignsList;