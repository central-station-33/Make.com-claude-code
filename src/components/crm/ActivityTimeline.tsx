import { useQuery } from "@tanstack/react-query";
import { CRMActivity } from "@/types/crm.types";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { Calendar, CheckCircle, Target, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

const ActivityTimeline = () => {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['crm-activities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_activities')
        .select(`
          *,
          crm_contacts (
            id,
            status,
            leads (
              name,
              email,
              phone,
              source,
              source_details,
              agent_id,
              profiles (
                full_name
              )
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CRMActivity[];
    }
  });

  if (isLoading) {
    return <div>Loading activities...</div>;
  }

  if (!activities?.length) {
    return <div>No activities found.</div>;
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <Card key={activity.id} className="p-4">
          <div className="space-y-2">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle className={`h-4 w-4 ${activity.completed_at ? 'text-green-500' : 'text-gray-400'}`} />
                <h3 className="font-medium">{activity.title}</h3>
                {activity.type && (
                  <Badge variant="secondary" className="ml-2">
                    {activity.type}
                  </Badge>
                )}
              </div>
              {activity.description && (
                <p className="mt-1 text-sm text-gray-500">{activity.description}</p>
              )}
              <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(activity.created_at || ''), 'PPp')}</span>
                </div>
                {activity.crm_contacts?.leads?.profiles?.full_name && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Agent: {activity.crm_contacts.leads.profiles.full_name}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="text-sm">
              {activity.crm_contacts?.leads?.name && (
                <div className="mb-2">
                  <strong>Lead:</strong> {activity.crm_contacts.leads.name}
                </div>
              )}
              {activity.crm_contacts?.leads?.source && (
                <div className="flex items-center gap-2 text-gray-500">
                  <Target className="h-4 w-4" />
                  <span>
                    Marketing Source: {activity.crm_contacts.leads.source}
                    {activity.crm_contacts.leads.source_details && (
                      <span className="block text-xs mt-1">
                        {JSON.stringify(activity.crm_contacts.leads.source_details)}
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default ActivityTimeline;