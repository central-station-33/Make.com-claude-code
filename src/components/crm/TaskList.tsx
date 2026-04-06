import { CRMTask } from "@/types/crm.types";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { Calendar } from "lucide-react";

export interface TaskListProps {
  tasks: CRMTask[];
  onComplete: (taskId: string) => Promise<void>;
}

const TaskList = ({ tasks, onComplete }: TaskListProps) => {
  if (!tasks?.length) {
    return <div>No tasks found</div>;
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <Card key={task.id} className="p-4">
          <div className="flex items-start gap-4">
            <Checkbox 
              checked={!!task.completed_at}
              className="mt-1"
              onCheckedChange={() => onComplete(task.id)}
            />
            <div className="flex-1">
              <h3 className="font-medium">{task.title}</h3>
              {task.contactName && (
                <p className="mt-1 text-sm text-gray-500">Contact: {task.contactName}</p>
              )}
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(), 'PPp')}</span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default TaskList;