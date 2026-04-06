
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AgentProgress } from "@/types/dashboard";
import { Skeleton } from "@/components/ui/skeleton";

interface AgentProgressTableProps {
  data: AgentProgress[];
  isLoading: boolean;
}

const AgentProgressTable = ({ data, isLoading }: AgentProgressTableProps) => {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Agent</TableHead>
          <TableHead>Leads</TableHead>
          <TableHead>Activities</TableHead>
          <TableHead>Follow-ups</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((agent) => (
          <TableRow key={agent.agent_id}>
            <TableCell>{agent.agent_name}</TableCell>
            <TableCell>{agent.lead_count}</TableCell>
            <TableCell>{agent.activities_count}</TableCell>
            <TableCell>{agent.follow_ups_count}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default AgentProgressTable;
