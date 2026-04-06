import { SchedulerForm } from "./follow-up/SchedulerForm";
import { useFollowUpScheduler } from "./follow-up/useFollowUpScheduler";

interface FollowUpSchedulerProps {
  leadId: string;
}

export const FollowUpScheduler = ({ leadId }: FollowUpSchedulerProps) => {
  const { error, scheduleFollowUp } = useFollowUpScheduler(leadId);

  const handleSchedule = (templateId: string, date: Date) => {
    scheduleFollowUp.mutate({ templateId, date });
  };

  return (
    <SchedulerForm
      onSubmit={handleSchedule}
      isSubmitting={scheduleFollowUp.isPending}
      error={error}
    />
  );
};