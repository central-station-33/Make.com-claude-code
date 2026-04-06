import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const DashboardHeader = () => {
  const { toast } = useToast();

  const handleStartABTest = () => {
    toast({
      title: "A/B Test Started",
      description: "Your marketing materials will be tested with different audiences.",
    });
  };

  return (
    <CardHeader className="flex flex-row items-center justify-between">
      <CardTitle>Marketing Dashboard</CardTitle>
      <div className="flex gap-2">
        <Button variant="outline" onClick={handleStartABTest}>
          <Target className="w-4 h-4 mr-2" />
          Start A/B Test
        </Button>
        <Button>
          <BarChart3 className="w-4 h-4 mr-2" />
          Analytics
        </Button>
      </div>
    </CardHeader>
  );
};