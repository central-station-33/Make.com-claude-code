import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { inrange } from '@/integrations/supabase/inrange';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail } from 'lucide-react';

interface Props {
  teamAgentId: string;
  mainEmail: string;
  backupEmail: string | null;
  onChanged?: () => void;
}

/**
 * Broker-only control: invite ONE backup login email for an agent.
 * The backup login signs in to the same profile with the same access
 * (see invite-agent `mode: 'backup'` and team_agent_logins).
 */
export default function BackupEmailControl({ teamAgentId, mainEmail, backupEmail, onChanged }: Props) {
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState('');
  const { toast } = useToast();

  const invite = useMutation({
    mutationFn: async () => {
      const clean = email.trim().toLowerCase();
      if (clean === mainEmail.toLowerCase()) throw new Error('Backup email must be different from the main email.');
      const { data, error } = await inrange.functions.invoke('invite-agent', {
        body: { mode: 'backup', email: clean, team_agent_id: teamAgentId },
      });
      if (error) throw error;
      if (data && data.success === false) throw new Error(data.error || 'Invite failed');
      return clean;
    },
    onSuccess: (clean) => {
      toast({ title: 'Backup login invited', description: `A sign-in invite was sent to ${clean}.` });
      setEditing(false);
      setEmail('');
      onChanged?.();
    },
    onError: (e: unknown) => {
      toast({ variant: 'destructive', title: 'Could not invite', description: e instanceof Error ? e.message : 'Try again.' });
    },
  });

  if (backupEmail) {
    return (
      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
        <Mail className="h-3 w-3" /> Backup login: {backupEmail}
      </p>
    );
  }

  if (!editing) {
    return (
      <button type="button" onClick={() => setEditing(true)}
        className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-1">
        + Add backup email
      </button>
    );
  }

  return (
    <form className="flex items-center gap-2 mt-1"
      onSubmit={(e) => { e.preventDefault(); if (email.trim()) invite.mutate(); }}>
      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
        placeholder="personal@email.com" aria-label="Backup email"
        className="text-xs border border-gray-300 dark:border-gray-700 rounded-md px-2 py-1 bg-white dark:bg-gray-950 min-w-0 flex-1" />
      <button type="submit" disabled={invite.isPending}
        className="text-xs font-medium bg-blue-600 text-white rounded-md px-2 py-1 disabled:opacity-60 flex items-center gap-1">
        {invite.isPending && <Loader2 className="h-3 w-3 animate-spin" />} Send invite
      </button>
      <button type="button" onClick={() => setEditing(false)} className="text-xs text-gray-500">Cancel</button>
    </form>
  );
}
