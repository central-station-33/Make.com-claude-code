import { Lead } from "@/types/lead";
import { Skeleton } from "@/components/ui/skeleton";
import LeadTableRow from "./LeadTableRow";
import { TableBody, TableCell, TableRow } from "@/components/ui/table";

interface LeadTableBodyProps {
  leads: Lead[] | undefined;
  isLoading: boolean;
  onRowClick: (lead: Lead) => void;
}

const LeadTableBody = ({ leads, isLoading, onRowClick }: LeadTableBodyProps) => {
  if (isLoading) {
    return (
      <TableBody>
        {Array.from({ length: 5 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell colSpan={8}>
              <Skeleton className="h-12 w-full" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    );
  }

  if (!leads?.length) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
            No leads found
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  return (
    <TableBody>
      {leads.map((lead) => (
        <LeadTableRow
          key={lead.id}
          lead={lead}
          onClick={() => onRowClick(lead)}
        />
      ))}
    </TableBody>
  );
};

export default LeadTableBody;