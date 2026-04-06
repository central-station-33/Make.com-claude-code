import { formatDistanceToNow } from "date-fns";
import { Card } from "@/components/ui/card";
import { ActivityIcon } from "./activity/ActivityIcon";
import { ActivityBadges } from "./activity/ActivityBadges";
import { ActivityContactInfo } from "./activity/ActivityContactInfo";
import { CRMActivity } from "@/types/crm.types";

interface ActivityItemProps {
  activity: CRMActivity;
}

const ActivityItem = ({ activity }: ActivityItemProps) => {
  return (
    <Card key={activity.id} className="p-4">
      <div className="flex items-start space-x-4">
        <div className="mt-1">
          <ActivityIcon type={activity.type} />
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium">{activity.title}</h4>
              <ActivityBadges 
                priority={activity.priority} 
                status={activity.status}
              />
            </div>
            <span className="text-sm text-gray-500">
              {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
            </span>
          </div>
          {activity.description && (
            <p className="text-sm text-gray-600 mt-2">
              {activity.description}
            </p>
          )}
          <ActivityContactInfo contact={activity.crm_contacts?.leads || null} />
        </div>
      </div>
    </Card>
  );
};

export default ActivityItem;