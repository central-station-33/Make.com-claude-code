import { TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Lead } from "@/types/lead";

interface LeadTypeCellProps {
  lead: Lead;
}

export const LeadTypeCell = ({ lead }: LeadTypeCellProps) => {
  return (
    <TableCell>
      <Badge variant="outline">{lead.type}</Badge>
    </TableCell>
  );
};