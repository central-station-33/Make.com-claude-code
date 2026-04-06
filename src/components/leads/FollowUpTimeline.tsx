import ErrorBoundary from "@/components/ErrorBoundary";
import TimelineList from "./timeline/TimelineList";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FollowUp } from "@/types/lead";

interface FollowUpTimelineProps {
  leadId: string;
}

export const FollowUpTimeline = ({ leadId }: FollowUpTimelineProps) => {
  const { data: followUps = [] } = useQuery({
    queryKey: ['followUps', leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_follow_ups')
        .select('*, template:follow_up_templates(*)')
        .eq('lead_id', leadId)
        .order('scheduled_for', { ascending: true });

      if (error) throw error;
      return data as FollowUp[];
    }
  });

  return (
    <ErrorBoundary>
      <TimelineList followUps={followUps} leadId={leadId} />
    </ErrorBoundary>
  );
};