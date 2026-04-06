import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AssignLeadDialog from "../leads/AssignLeadDialog";
import { Lead } from "@/types/lead";
import { Badge } from "@/components/ui/badge";

interface UnassignedLeadsTableProps {
  leads: Lead[];
  onAssigned: () => void;
}

const UnassignedLeadsTable = ({ leads, onAssigned }: UnassignedLeadsTableProps) => {
  // Filter out leads that already have agents assigned
  const unassignedLeads = leads.filter(lead => !lead.agent_id);

  if (unassignedLeads.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No unassigned leads found
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {unassignedLeads.map((lead) => (
          <TableRow key={lead.id}>
            <TableCell>{lead.name}</TableCell>
            <TableCell>{lead.email}</TableCell>
            <TableCell>
              <Badge variant="outline">{lead.status}</Badge>
            </TableCell>
            <TableCell>{lead.type}</TableCell>
            <TableCell>
              <AssignLeadDialog
                leadId={lead.id}
                currentAgentId={lead.agent_id}
                onAssigned={onAssigned}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default UnassignedLeadsTable;