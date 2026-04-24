import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, DollarSign, User } from 'lucide-react';
import { mockPipeline, mockOpportunities } from './wireData';
import type { WireOpportunity, WirePipelineStage } from '@/types/wire.types';
import { cn } from '@/lib/utils';

function OpportunityCard({ opp }: { opp: WireOpportunity }) {
  return (
    <div className="bg-white border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing space-y-2">
      <p className="text-sm font-semibold leading-tight">{opp.name}</p>
      {opp.value && (
        <div className="flex items-center gap-1 text-xs text-green-700 font-medium">
          <DollarSign className="h-3 w-3" />
          {opp.value.toLocaleString()}
        </div>
      )}
      {opp.assigned_to && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <User className="h-3 w-3" />
          {opp.assigned_to}
        </div>
      )}
      {opp.close_date && (
        <p className="text-xs text-muted-foreground">
          Close: {new Date(opp.close_date).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}

function PipelineColumn({
  stage,
  opportunities,
}: {
  stage: WirePipelineStage;
  opportunities: WireOpportunity[];
}) {
  const total = opportunities.reduce((sum, o) => sum + (o.value ?? 0), 0);

  return (
    <div className="flex flex-col min-w-[220px] max-w-[220px]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: stage.color }}
          />
          <h3 className="text-sm font-semibold">{stage.name}</h3>
          <span className="text-xs text-muted-foreground bg-gray-100 px-1.5 py-0.5 rounded-full">
            {opportunities.length}
          </span>
        </div>
      </div>
      {total > 0 && (
        <p className="text-xs text-muted-foreground mb-3">
          ${total.toLocaleString()} total
        </p>
      )}
      <div className="flex-1 space-y-2 min-h-[200px]">
        {opportunities.map((opp) => (
          <OpportunityCard key={opp.id} opp={opp} />
        ))}
        <button className="w-full border-2 border-dashed border-gray-200 rounded-lg p-2 text-xs text-muted-foreground hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-1">
          <Plus className="h-3 w-3" />
          Add Deal
        </button>
      </div>
    </div>
  );
}

export function WirePipeline() {
  const [view, setView] = useState<'kanban' | 'list'>('kanban');

  const totalValue = mockOpportunities.reduce((sum, o) => sum + (o.value ?? 0), 0);

  return (
    <div className="p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold">Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mockPipeline.name} · ${totalValue.toLocaleString()} total value
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border rounded-lg overflow-hidden">
            <button
              onClick={() => setView('kanban')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium transition-colors',
                view === 'kanban' ? 'bg-gray-900 text-white' : 'hover:bg-gray-100'
              )}
            >
              Kanban
            </button>
            <button
              onClick={() => setView('list')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium transition-colors',
                view === 'list' ? 'bg-gray-900 text-white' : 'hover:bg-gray-100'
              )}
            >
              List
            </button>
          </div>
          <Button size="sm" className="bg-gray-900 hover:bg-gray-700 text-white gap-1.5">
            <Plus className="h-4 w-4" />
            New Deal
          </Button>
        </div>
      </div>

      {view === 'kanban' ? (
        <div className="flex gap-5 overflow-x-auto pb-4 flex-1">
          {mockPipeline.stages.map((stage) => {
            const stageOpps = mockOpportunities.filter((o) => o.stage_id === stage.id);
            return (
              <PipelineColumn key={stage.id} stage={stage} opportunities={stageOpps} />
            );
          })}
        </div>
      ) : (
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Deal</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Contact</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Stage</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Value</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Assigned</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Close Date</th>
              </tr>
            </thead>
            <tbody>
              {mockOpportunities.map((opp) => {
                const stage = mockPipeline.stages.find((s) => s.id === opp.stage_id);
                return (
                  <tr key={opp.id} className="border-b hover:bg-gray-50 cursor-pointer">
                    <td className="px-4 py-3 font-medium">{opp.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {opp.contact?.first_name} {opp.contact?.last_name}
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: stage?.color }}
                        />
                        {stage?.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-green-700">
                      {opp.value ? `$${opp.value.toLocaleString()}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{opp.assigned_to ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {opp.close_date
                        ? new Date(opp.close_date).toLocaleDateString()
                        : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
