import StatsCard from "../stats/StatsCard";
import { TrendingUp } from "lucide-react";

interface ConversionCardProps {
  totalLeads: number;
  qualifiedLeads: number;
  conversionRate: number;
}

const ConversionCard = ({ 
  totalLeads, 
  qualifiedLeads, 
  conversionRate 
}: ConversionCardProps) => {
  return (
    <StatsCard
      title="Conversion Rate"
      value={`${conversionRate.toFixed(1)}%`}
      subtitle={`${qualifiedLeads} qualified out of ${totalLeads} total leads`}
      icon={TrendingUp}
      iconColor="text-purple-500"
    />
  );
};

export default ConversionCard;