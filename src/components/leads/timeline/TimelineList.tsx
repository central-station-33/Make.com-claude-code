import { FollowUp } from "@/types/lead";
import TimelineItem from "./TimelineItem";

export interface TimelineListProps {
  followUps: FollowUp[];
  leadId: string;
}

const TimelineList = ({ followUps, leadId }: TimelineListProps) => {
  if (!followUps.length) {
    return (
      <div className="text-center text-gray-500 py-4">
        No follow-ups scheduled
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {followUps.map((followUp) => (
        <TimelineItem key={followUp.id} followUp={followUp} />
      ))}
    </div>
  );
};

export default TimelineList;