import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ExpiredCampaignsList from "./ExpiredCampaignsList";

const ExpiredCampaignsPage = () => {
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Expired Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpiredCampaignsList />
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpiredCampaignsPage;