import React from 'react';
import { format } from 'date-fns';
import { FollowUp } from '@/types/lead';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface TimelineItemProps {
  followUp: FollowUp;
}

const TimelineItem: React.FC<TimelineItemProps> = ({ followUp }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold">{followUp.template.name}</h3>
            <p className="text-sm text-gray-600">{followUp.template.description}</p>
          </div>
          <Badge className={getStatusColor(followUp.status || 'pending')}>
            {followUp.status || 'pending'}
          </Badge>
        </div>
        
        <div className="mt-2 text-sm text-gray-600">
          <p>Scheduled for: {format(new Date(followUp.scheduled_for), 'PPp')}</p>
          {followUp.completed_at && (
            <p>Completed: {format(new Date(followUp.completed_at), 'PPp')}</p>
          )}
          {followUp.notes && <p className="mt-2">{followUp.notes}</p>}
        </div>
      </CardContent>
    </Card>
  );
};

export default TimelineItem;