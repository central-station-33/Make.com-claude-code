
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface LeadProgress {
  stage: string;
  count: number;
  percentage: number;
}

export const LeadProgressBoard = () => {
  const [progress, setProgress] = useState<LeadProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    loadProgress();
  }, [timeframe]);

  const loadProgress = async () => {
    try {
      let query = supabase
        .from('lead_funnel_progress')
        .select('current_stage, created_at');

      // Apply timeframe filters
      if (timeframe === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        query = query.gt('created_at', weekAgo.toISOString());
      } else if (timeframe === 'month') {
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        query = query.gt('created_at', monthAgo.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      if (!data) {
        setProgress([]);
        return;
      }

      // Calculate totals and percentages
      const stageCounts = data.reduce((acc, curr) => {
        acc[curr.current_stage] = (acc[curr.current_stage] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const totalCount = data.length || 1; // Prevent division by zero

      const progressData: LeadProgress[] = [
        { stage: 'Cold', count: stageCounts.cold || 0, percentage: (stageCounts.cold || 0) / totalCount * 100 },
        { stage: 'Contacted', count: stageCounts.contacted || 0, percentage: (stageCounts.contacted || 0) / totalCount * 100 },
        { stage: 'Qualified', count: stageCounts.qualified || 0, percentage: (stageCounts.qualified || 0) / totalCount * 100 },
        { stage: 'Negotiating', count: stageCounts.negotiating || 0, percentage: (stageCounts.negotiating || 0) / totalCount * 100 },
        { stage: 'Closed Won', count: stageCounts.closed_won || 0, percentage: (stageCounts.closed_won || 0) / totalCount * 100 },
        { stage: 'Closed Lost', count: stageCounts.closed_lost || 0, percentage: (stageCounts.closed_lost || 0) / totalCount * 100 }
      ];

      setProgress(progressData);
    } catch (error) {
      console.error('Error loading progress:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load lead progress data"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Lead Progress</h2>
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="week">Last 7 Days</SelectItem>
            <SelectItem value="month">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {progress.map((stage) => (
          <div key={stage.stage} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{stage.stage}</span>
              <span className="text-muted-foreground">
                {stage.count} ({stage.percentage.toFixed(1)}%)
              </span>
            </div>
            <Progress value={stage.percentage} className="h-2" />
          </div>
        ))}
      </div>
    </Card>
  );
};
