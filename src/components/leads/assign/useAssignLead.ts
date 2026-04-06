import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useAssignLead = (leadId: string, onAssigned?: () => void) => {
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: agents = [], isLoading: isLoadingAgents } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      console.log('Fetching agents...');
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .not('full_name', 'is', null)
        .order('full_name', { ascending: true });
      
      if (error) {
        console.error('Error fetching agents:', error);
        throw error;
      }
      console.log('Fetched agents:', data);
      return data;
    },
  });

  const assignMutation = useMutation({
    mutationFn: async (agentId: string | null) => {
      console.log('Assigning lead:', leadId, 'to agent:', agentId);
      const { error } = await supabase
        .from('leads')
        .update({ agent_id: agentId === 'unassigned' ? null : agentId })
        .eq('id', leadId);

      if (error) throw error;
    },
    onSuccess: (_, agentId) => {
      toast({
        title: "Success",
        description: agentId === 'unassigned'
          ? "Lead unassigned successfully" 
          : "Lead assigned successfully",
      });
      onAssigned?.();
    },
    onError: (error: Error) => {
      console.error('Error assigning lead:', error);
      setError(error.message);
      toast({
        variant: "destructive",
        title: "Error assigning lead",
        description: error.message,
      });
    },
  });

  return {
    agents,
    error,
    isLoadingAgents,
    assignLead: assignMutation.mutate,
    isAssigning: assignMutation.isPending
  };
};