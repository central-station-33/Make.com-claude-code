import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Mail, MessageSquare, BarChart2, Send, Eye, MousePointerClick } from 'lucide-react';
import { mockCampaigns } from './wireData';
import type { WireCampaign } from '@/types/wire.types';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<WireCampaign['status'], string> = {
  draft: 'border-gray-400 text-gray-600',
  scheduled: 'border-blue-400 text-blue-700',
  active: 'border-green-400 text-green-700',
  paused: 'border-yellow-400 text-yellow-700',
  completed: 'border-purple-400 text-purple-700',
};

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

function CampaignCard({ campaign }: { campaign: WireCampaign }) {
  const openRate =
    campaign.sent_count > 0
      ? Math.round((campaign.open_count / campaign.sent_count) * 100)
      : 0;
  const clickRate =
    campaign.open_count > 0
      ? Math.round((campaign.click_count / campaign.open_count) * 100)
      : 0;

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
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
                    <StatPill
                      icon={MousePointerClick}
                      label={`clicks (${clickRate}%)`}
                      value={campaign.click_count}
                    />
                  </>
                )}
              </div>

              {campaign.sent_count > 0 && campaign.recipient_count > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-blue-400 h-1.5 rounded-full"
                        style={{
                          width: `${Math.round((campaign.open_count / campaign.sent_count) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-12 text-right">{openRate}% open</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-green-400 h-1.5 rounded-full"
                        style={{ width: `${clickRate}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-12 text-right">{clickRate}% click</span>
                  </div>
                </div>
              )}

              {(campaign.scheduled_at || campaign.sent_at) && (
                <p className="text-xs text-muted-foreground mt-2">
                  {campaign.sent_at
                    ? `Sent ${new Date(campaign.sent_at).toLocaleDateString()}`
                    : `Scheduled for ${new Date(campaign.scheduled_at!).toLocaleDateString()}`}
                </p>
              )}
            </div>
          </div>
          <Button variant="outline" size="sm">
            <BarChart2 className="h-3.5 w-3.5 mr-1" />
            Stats
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function WireCampaigns() {
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mockCampaigns.length} campaigns total
          </p>
        </div>
        <Button className="bg-gray-900 hover:bg-gray-700 text-white gap-2">
          <Plus className="h-4 w-4" />
          New Campaign
        </Button>
      </div>

      <div className="space-y-4">
        {mockCampaigns.map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} />
        ))}
      </div>
    </div>
  );
}
