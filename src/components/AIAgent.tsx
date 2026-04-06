import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Tool {
  id: string;
  name: string;
  description: string;
  type: string;
  enabled: boolean;
}

export const AIAgent = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTools = async () => {
      try {
        const toolsQuery = supabase
          .from('agent_tools')
          .select('*')
          .eq('enabled', true);

        const { data, error } = await toolsQuery;

        if (error) {
          throw error;
        }

        setTools(data || []);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error loading tools",
          description: 
            "Failed to load tools. Please try again or contact support.",
        });
      }
    };

    fetchTools();
  }, [toast]);

  return (
    <div>
      <h1>AIAgent Tools</h1>
      <ul>
        {tools.map(tool => (
          <li key={tool.id}>
            <h2>{tool.name}</h2>
            <p>{tool.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AIAgent;
