import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Lead } from "@/types/lead";

export interface LeadTableHeaderProps {
  sortField: keyof Lead;
  sortDirection: "asc" | "desc";
  onSort: (field: keyof Lead) => void;
}

const LeadTableHeader = ({ sortField, sortDirection, onSort }: LeadTableHeaderProps) => {
  return (
    <TableHeader>
      <TableRow>
        <TableHead onClick={() => onSort("name")} className="cursor-pointer">
          Name {sortField === "name" && (sortDirection === "asc" ? "↑" : "↓")}
        </TableHead>
        <TableHead onClick={() => onSort("email")} className="cursor-pointer">
          Email {sortField === "email" && (sortDirection === "asc" ? "↑" : "↓")}
        </TableHead>
        <TableHead onClick={() => onSort("phone")} className="cursor-pointer">
          Phone {sortField === "phone" && (sortDirection === "asc" ? "↑" : "↓")}
        </TableHead>
        <TableHead onClick={() => onSort("type")} className="cursor-pointer">
          Type {sortField === "type" && (sortDirection === "asc" ? "↑" : "↓")}
        </TableHead>
        <TableHead onClick={() => onSort("location")} className="cursor-pointer">
          Location {sortField === "location" && (sortDirection === "asc" ? "↑" : "↓")}
        </TableHead>
        <TableHead onClick={() => onSort("status")} className="cursor-pointer">
          Status {sortField === "status" && (sortDirection === "asc" ? "↑" : "↓")}
        </TableHead>
        <TableHead onClick={() => onSort("agent_id")} className="cursor-pointer">
          Agent {sortField === "agent_id" && (sortDirection === "asc" ? "↑" : "↓")}
        </TableHead>
        <TableHead onClick={() => onSort("created_at")} className="cursor-pointer">
          Created {sortField === "created_at" && (sortDirection === "asc" ? "↑" : "↓")}
        </TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default LeadTableHeader;