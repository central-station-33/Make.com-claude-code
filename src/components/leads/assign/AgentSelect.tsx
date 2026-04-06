import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AgentSelectProps {
  agents: Array<{ id: string; full_name: string; email: string }>;
  selectedAgent: string | null;
  onAgentChange: (value: string) => void;
}

const AgentSelect = ({ agents, selectedAgent, onAgentChange }: AgentSelectProps) => {
  if (!agents || agents.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No agents available for assignment
      </div>
    );
  }

  return (
    <Select 
      value={selectedAgent || undefined} 
      onValueChange={onAgentChange}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select an agent" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="unassigned">Unassigned</SelectItem>
        {agents.map((agent) => (
          <SelectItem key={agent.id} value={agent.id}>
            {agent.full_name || agent.email}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default AgentSelect;