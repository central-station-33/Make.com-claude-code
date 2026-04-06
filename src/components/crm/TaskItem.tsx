import { formatDistanceToNow } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TaskItemProps {
  id: string;
  title: string;
  description?: string | null;
  due_date?: string | null;
  contactName?: string | null;
  onComplete: (taskId: string) => void;
}

const TaskItem = ({
  id,
  title,
  description,
  due_date,
  contactName,
  onComplete,
}: TaskItemProps) => {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="text-base font-medium">{title}</h4>
          {description && (
            <p className="mt-1 text-sm text-gray-600">
              {description}
            </p>
          )}
          <div className="flex justify-between mt-2 text-sm text-gray-500">
            <span>For: {contactName || 'Unassigned'}</span>
            {due_date && (
              <span>Due: {formatDistanceToNow(new Date(due_date), { addSuffix: true })}</span>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onComplete(id)}
          className="ml-4"
        >
          Complete
        </Button>
      </div>
    </Card>
  );
};

export default TaskItem;