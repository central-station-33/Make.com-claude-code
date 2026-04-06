import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { scheduleFollowUp } from "./services/followUpService";

export const useFollowUpScheduler = (leadId: string) => {
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const scheduleFollowUpMutation = useMutation({
    mutationFn: async (params: { templateId: string; date: Date }) => {
      setError(null);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error("Not authenticated");
        }

        return await scheduleFollowUp(supabase, {
          leadId,
          templateId: params.templateId,
          date: params.date,
          userId: user.id
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "An unexpected error occurred";
        setError(message);
        throw err;
      }
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Follow-up scheduled",
        description: `Follow-up scheduled for ${format(variables.date, 'PPP')}`,
      });
      queryClient.invalidateQueries({ queryKey: ['followUps', leadId] });
      setError(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setError(error.message);
    },
  });

  return {
    error,
    scheduleFollowUp: scheduleFollowUpMutation,
  };
};