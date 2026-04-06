import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ActivityBadgesProps {
  priority?: string;
  status?: string;
}

const getPriorityColor = (priority: string) => {
  switch (priority?.toLowerCase()) {
    case 'high':
      return "bg-red-100 text-red-800";
    case 'urgent':
      return "bg-purple-100 text-purple-800";
    case 'low':
      return "bg-green-100 text-green-800";
    default:
      return "bg-blue-100 text-blue-800";
  }
};

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'completed':
      return "bg-green-100 text-green-800";
    case 'in_progress':
      return "bg-yellow-100 text-yellow-800";
    case 'cancelled':
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const ActivityBadges = ({ priority, status }: ActivityBadgesProps) => {
  return (
    <div className="flex gap-2 mt-1">
      {priority && (
        <Badge className={cn("text-xs", getPriorityColor(priority))}>
          {priority}
        </Badge>
      )}
      {status && (
        <Badge className={cn("text-xs", getStatusColor(status))}>
          {status}
        </Badge>
      )}
    </div>
  );
};