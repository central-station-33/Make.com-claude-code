import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
}

const StatsCard = ({ title, value, subtitle, icon: Icon, iconColor = "text-blue-500" }: StatsCardProps) => {
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

export default StatsCard;