
import { Card } from "@/components/ui/card";
import { AgentProgress } from "@/types/dashboard";
import AgentProgressTable from "../stats/AgentProgressTable";

interface AgentPerformanceSectionProps {
  data: AgentProgress[];
  isLoading: boolean;
}

export const AgentPerformanceSection = ({ data, isLoading }: AgentPerformanceSectionProps) => {
  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Agent Performance</h3>
      </div>
      <AgentProgressTable 
        data={data} 
        isLoading={isLoading} 
      />
    </Card>
  );
};
