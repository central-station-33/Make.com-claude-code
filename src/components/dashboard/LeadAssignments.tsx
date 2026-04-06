import { Card } from "@/components/ui/card";
import { Lead } from "@/types/lead";
import UnassignedLeadsTable from "./UnassignedLeadsTable";

interface LeadAssignmentsProps {
  leads: Lead[];
}

const LeadAssignments = ({ leads }: LeadAssignmentsProps) => {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Lead Assignments</h2>
        <p className="text-muted-foreground">
          Assign leads to team members and track their progress.
        </p>
        <UnassignedLeadsTable 
          leads={leads} 
          onAssigned={() => window.location.reload()}
        />
      </div>
    </Card>
  );
};

export default LeadAssignments;