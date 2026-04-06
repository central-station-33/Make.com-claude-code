import { TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Lead } from "@/types/lead";

interface LeadStatusCellProps {
  lead: Lead;
}

export const LeadStatusCell = ({ lead }: LeadStatusCellProps) => {
  const getStatusColor = (status: string): "default" | "destructive" | "secondary" | "outline" => {
    switch (status) {
      case 'New':
        return 'default';
      case 'Qualified':
        return 'secondary';
      case 'Contacted':
        return 'outline';
      case 'Lost':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <TableCell>
      <Badge variant={getStatusColor(lead.status)}>{lead.status}</Badge>
    </TableCell>
  );
};