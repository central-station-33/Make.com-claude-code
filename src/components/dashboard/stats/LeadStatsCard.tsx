import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface LeadStatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor: string;
}

const LeadStatsCard = ({ title, value, subtitle, icon: Icon, iconColor }: LeadStatsCardProps) => {
  return (
    <Card className="p-6">
      <div className="flex items-center space-x-3">
        <Icon className={`h-5 w-5 ${iconColor}`} />
        <div>
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className="mt-2 text-3xl font-semibold text-primary">{value}</p>
          {subtitle && <div className="mt-2 text-sm text-gray-600">{subtitle}</div>}
        </div>
      </div>
    </Card>
  );
};

export default LeadStatsCard;