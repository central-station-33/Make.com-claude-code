import { TableCell } from "@/components/ui/table";
import { format } from "date-fns";
import { Lead } from "@/types/lead";

interface LeadDateCellProps {
  lead: Lead;
}

export const LeadDateCell = ({ lead }: LeadDateCellProps) => {
  return (
    <TableCell>
      {lead.created_at ? format(new Date(lead.created_at), "MMM d, yyyy") : "N/A"}
    </TableCell>
  );
};