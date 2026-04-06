
import { LeadControlPanel } from "./LeadControlPanel";
import { LeadProgressBoard } from "./LeadProgressBoard";

export const LeadControl = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Lead Control Center</h1>
      <p className="text-muted-foreground">
        Manage lead distribution and monitor sales funnel progress
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <LeadControlPanel />
        <LeadProgressBoard />
      </div>
    </div>
  );
};
