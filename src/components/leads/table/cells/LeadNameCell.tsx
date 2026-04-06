import { TableCell } from "@/components/ui/table";
import { Lead } from "@/types/lead";

interface LeadNameCellProps {
  lead: Lead;
}

export const LeadNameCell = ({ lead }: LeadNameCellProps) => {
  return (
    <TableCell>{lead.name || 'N/A'}</TableCell>
  );
};