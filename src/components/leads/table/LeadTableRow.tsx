import { TableRow } from "@/components/ui/table";
import { Lead } from "@/types/lead";
import { LeadNameCell } from "./cells/LeadNameCell";
import { LeadContactCell } from "./cells/LeadContactCell";
import { LeadTypeCell } from "./cells/LeadTypeCell";
import { LeadStatusCell } from "./cells/LeadStatusCell";
import { LeadAgentCell } from "./cells/LeadAgentCell";
import { LeadDateCell } from "./cells/LeadDateCell";

export interface LeadTableRowProps {
  lead: Lead;
  onClick?: (lead: Lead) => void;
}

const LeadTableRow = ({ lead, onClick }: LeadTableRowProps) => {
  return (
    <TableRow 
      onClick={() => onClick?.(lead)} 
      className="cursor-pointer hover:bg-muted/50"
      data-testid={`lead-row-${lead.id}`}
    >
      <LeadNameCell lead={lead} />
      <LeadContactCell lead={lead} />
      <LeadTypeCell lead={lead} />
      <LeadStatusCell lead={lead} />
      <LeadAgentCell lead={lead} />
      <LeadDateCell lead={lead} />
    </TableRow>
  );
};

export default LeadTableRow;