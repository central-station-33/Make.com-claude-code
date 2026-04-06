import { Card } from "@/components/ui/card";
import { Lead } from "@/types/lead";
import LeadTableHeader from "./LeadTableHeader";
import LeadTableBody from "./LeadTableBody";
import { Table } from "@/components/ui/table";

interface LeadTableProps {
  leads: Lead[];
  isLoading: boolean;
  sortField: keyof Lead;
  sortDirection: "asc" | "desc";
  onSort: (field: keyof Lead) => void;
  onRowClick: (lead: Lead) => void;
}

const LeadTable = ({
  leads,
  isLoading,
  sortField,
  sortDirection,
  onSort,
  onRowClick,
}: LeadTableProps) => {
  return (
    <Card className="w-full">
      <div className="overflow-x-auto">
        <Table>
          <LeadTableHeader
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={onSort}
          />
          <LeadTableBody 
            leads={leads}
            isLoading={isLoading}
            onRowClick={onRowClick}
          />
        </Table>
      </div>
    </Card>
  );
};

export default LeadTable;