import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Mail,
  MessageSquare,
  Send,
  Eye,
  MousePointerClick,
  MoreHorizontal,
  AlertCircle,
  Megaphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWireCampaigns, type CampaignFormData } from '@/hooks/useWireCampaigns';
import { CampaignDialog } from './CampaignDialog';
import type { WireCampaign } from '@/types/wire.types';

const STATUS_STYLES: Record<WireCampaign['status'], string> = {
  draft:     'border-gray-400 text-gray-600',
  scheduled: 'border-blue-400 text-blue-700',
  active:    'border-green-400 text-green-700',
  paused:    'border-yellow-400 text-yellow-700',
  completed: 'border-purple-400 text-purple-700',
};

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: 'All', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Active', value: 'active' },
  { label: 'Completed', value: 'completed' },
];

function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Icon className="h-3 w-3" />
      <span>{value}</span>
      <span className="text-gray-300">·</span>
      <span>{label}</span>
    </div>
  );
}

interface CampaignCardProps {
  campaign: WireCampaign;
  onEdit: (c: WireCampaign) => void;
  onDelete: (c: WireCampaign) => void;
  onDuplicate: (c: WireCampaign) => void;
}

function CampaignCard({ campaign, onEdit, onDelete, onDuplicate }: CampaignCardProps) {
  const openRate =
    campaign.sent_count > 0
      ? Math.round((campaign.open_count / campaign.sent_count) * 100)
      : 0;
  const clickRate =
    campaign.open_count > 0
      ? Math.round((campaign.click_count / campaign.open_count) * 100)
      : 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
              {campaign.type === 'email' ? (
                <Mail className="h-5 w-5 text-gray-600" />
              ) : (
                <MessageSquare className="h-5 w-5 text-gray-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <p className="font-semibold text-sm">{campaign.name}</p>
                <Badge variant="outline" className={cn('capitalize text-xs', STATUS_STYLES[campaign.status])}>
                  {campaign.status}
                </Badge>
                <Badge variant="secondary" className="text-xs capitalize">
                  {campaign.type}
                </Badge>
              </div>

              {campaign.subject && (
                <p className="text-xs text-muted-foreground truncate">{campaign.subject}</p>
              )}

              <div className="flex items-center gap-4 mt-3 flex-wrap">
                <StatPill icon={Send} label="recipients" value={campaign.recipient_count} />
                {campaign.sent_count > 0 && (
                  <>
                    <StatPill icon={Eye} label={`open (${openRate}%)`} value={campaign.open_count} />
                    <StatPill icon={MousePointerClick} label={`clicks (${clickRate}%)`} value={campaign.click_count} />
                  </>
                )}
              </div>

              {campaign.sent_count > 0 && campaign.recipient_count > 0 && (
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-blue-400 h-1.5 rounded-full transition-all"
                        style={{ width: `${openRate}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-14 text-right">{openRate}% open</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-green-400 h-1.5 rounded-full transition-all"
                        style={{ width: `${clickRate}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-14 text-right">{clickRate}% click</span>
                  </div>
                </div>
              )}

              {(campaign.scheduled_at || campaign.sent_at) && (
                <p className="text-xs text-muted-foreground mt-2">
                  {campaign.sent_at
                    ? `Sent ${new Date(campaign.sent_at).toLocaleDateString()}`
                    : `Scheduled for ${new Date(campaign.scheduled_at!).toLocaleString()}`}
                </p>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(campaign)}>Edit Campaign</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(campaign)}>Duplicate</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(campaign)}
                className="text-red-600 focus:text-red-600"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

export function WireCampaigns() {
  const { campaigns, loading, error, addCampaign, updateCampaign, deleteCampaign, duplicateCampaign } =
    useWireCampaigns();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCampaign, setEditCampaign] = useState<WireCampaign | null>(null);
  const [deletingCampaign, setDeletingCampaign] = useState<WireCampaign | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  const openAdd = () => { setEditCampaign(null); setDialogOpen(true); };
  const openEdit = (c: WireCampaign) => { setEditCampaign(c); setDialogOpen(true); };

  const handleSave = async (data: CampaignFormData) => {
    if (editCampaign) {
      await updateCampaign(editCampaign.id, data);
    } else {
      await addCampaign(data);
    }
  };

  const handleDelete = async () => {
    if (!deletingCampaign) return;
    setDeleting(true);
    try {
      await deleteCampaign(deletingCampaign.id);
    } finally {
      setDeleting(false);
      setDeletingCampaign(null);
    }
  };

  const filtered = statusFilter === 'all'
    ? campaigns
    : campaigns.filter((c) => c.status === statusFilter);

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? 'Loading...' : `${campaigns.length} campaign${campaigns.length !== 1 ? 's' : ''} total`}
          </p>
        </div>
        <Button onClick={openAdd} className="bg-gray-900 hover:bg-gray-700 text-white gap-2">
          <Plus className="h-4 w-4" />
          New Campaign
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Status filter */}
      {!loading && campaigns.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                'text-xs px-3 py-1 rounded-full border font-medium transition-colors',
                statusFilter === f.value
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'border-gray-300 hover:bg-gray-100'
              )}
            >
              {f.label}
              {f.value !== 'all' && (
                <span className="ml-1 text-gray-400">
                  ({campaigns.filter((c) => c.status === f.value).length})
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Campaign list */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="flex gap-3">
                  <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-72" />
                    <div className="flex gap-4 mt-3">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Megaphone className="h-10 w-10 mx-auto mb-3 opacity-30" />
            {campaigns.length === 0 ? (
              <>
                <p className="text-base font-medium">No campaigns yet</p>
                <p className="text-sm mt-1">Create your first email or SMS campaign.</p>
                <Button onClick={openAdd} className="mt-4 bg-gray-900 hover:bg-gray-700 text-white gap-2">
                  <Plus className="h-4 w-4" /> New Campaign
                </Button>
              </>
            ) : (
              <p className="text-sm">No {statusFilter} campaigns.</p>
            )}
          </div>
        ) : (
          filtered.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onEdit={openEdit}
              onDelete={setDeletingCampaign}
              onDuplicate={duplicateCampaign}
            />
          ))
        )}
      </div>

      <CampaignDialog
        open={dialogOpen}
        campaign={editCampaign}
        onClose={() => { setDialogOpen(false); setEditCampaign(null); }}
        onSave={handleSave}
      />

      <AlertDialog open={!!deletingCampaign} onOpenChange={(o) => !o && setDeletingCampaign(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deletingCampaign?.name}". This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? 'Deleting...' : 'Delete Campaign'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
