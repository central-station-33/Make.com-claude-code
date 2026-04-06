import { TableCell } from "@/components/ui/table";
import { Lead } from "@/types/lead";

interface LeadContactCellProps {
  lead: Lead;
}

export const LeadContactCell = ({ lead }: LeadContactCellProps) => {
  return (
    <>
      <TableCell>{lead.email || 'N/A'}</TableCell>
      <TableCell>{lead.phone || "N/A"}</TableCell>
    </>
  );
};