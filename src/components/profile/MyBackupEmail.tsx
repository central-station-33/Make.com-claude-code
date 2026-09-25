import { useQuery, useQueryClient } from '@tanstack/react-query';
import { inrange } from '@/integrations/supabase/inrange';
import { useAuth } from '@/contexts/AuthContext';
import { fetchCurrentTeamAgentId } from '@/lib/currentTeamAgent';
import BackupEmailControl from '@/components/agents/BackupEmailControl';

/** Profile section: lets an agent add their own backup login email. */
export default function MyBackupEmail() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['my-backup-email', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const agentId = await fetchCurrentTeamAgentId();
      if (!agentId || !user?.id) return null;
      const [{ data: agent }, { data: ownBackup }] = await Promise.all([
        inrange.from('team_agents' as never).select('email, backup_email').eq('id', agentId).maybeSingle(),
        inrange.from('team_agent_logins' as never).select('auth_user_id').eq('auth_user_id', user.id).maybeSingle(),
      ]);
      const a = agent as { email?: string; backup_email?: string | null } | null;
      return { mainEmail: a?.email ?? '', backupEmail: a?.backup_email ?? null, signedInWithBackup: !!ownBackup };
    },
  });

  if (!data) return null;

  return (
    <div className="pt-6 border-t">
      <h3 className="text-sm font-semibold mb-1">Backup login email</h3>
      <p className="text-xs text-muted-foreground mb-2">
        A second email (for example your personal email) that signs in to this same profile with the same access.
        We&apos;ll send it a sign-in invite. Only use an email that you alone control.
      </p>
      {data.signedInWithBackup ? (
        <p className="text-xs text-muted-foreground">You&apos;re signed in with your backup email. Sign in with your main email to change it.</p>
      ) : (
        <BackupEmailControl
          mainEmail={data.mainEmail}
          backupEmail={data.backupEmail}
          onChanged={() => queryClient.invalidateQueries({ queryKey: ['my-backup-email', user?.id] })}
        />
      )}
    </div>
  );
}
