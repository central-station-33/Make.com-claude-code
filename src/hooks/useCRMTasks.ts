import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CRMTask } from "@/types/crm.types";

export const useCRMTasks = () => {
  const [tasks, setTasks] = useState<CRMTask[]>([]);
  const { toast } = useToast();

  const handleTaskComplete = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('crm_activities')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: "Task completed",
        description: "The task has been marked as complete.",
      });

      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, status: 'completed', completed_at: new Date().toISOString() }
          : task
      ));

    } catch (error) {
      console.error('Error completing task:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to complete task. Please try again.",
      });
    }
  };

  return {
    tasks,
    setTasks,
    handleTaskComplete
  };
};