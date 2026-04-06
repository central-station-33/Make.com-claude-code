
import { LeadWithProfile } from '@/types/dashboard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface LeadAgentCellProps {
  lead: LeadWithProfile;
}

export const LeadAgentCell = ({ lead }: LeadAgentCellProps) => {
  // Use profiles?.full_name as the primary source for agent name
  const agentName = lead.profiles?.full_name || 'Unassigned';
  const avatarUrl = lead.profiles?.avatar_url;

  return (
    <div className="flex items-center gap-2">
      <Avatar className="h-8 w-8">
        {avatarUrl && <AvatarImage src={avatarUrl} alt={agentName} />}
        <AvatarFallback>
          {agentName.split(' ').map(n => n[0]).join('').toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <span className="text-sm">{agentName}</span>
    </div>
  );
};
