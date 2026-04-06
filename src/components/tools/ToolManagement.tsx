import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface Tool {
  id: string;
  name: string;
  description: string;
  type: string;
  enabled: boolean;
}

export const ToolManagement = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const { toast } = useToast();

  const formatToolData = (data: any[]): Tool[] => {
    return (data || []).map(tool => ({
      id: tool.id,
      name: tool.name,
      description: tool.description,
      type: tool.type,
      enabled: tool.enabled,
    }));
  };

  const handleConfigureClick = () => {
    toast({
      variant: "default",
      title: "Coming Soon",
      description: "Tool configuration dialog will be added soon.",
    });
  };

  return (
    <div>
      <h1>Tool Management</h1>
      <ul>
        {tools.map(tool => (
          <li key={tool.id}>
            <h2>{tool.name}</h2>
            <p>{tool.description}</p>
            <button onClick={handleConfigureClick}>Configure</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ToolManagement;
