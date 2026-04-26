import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, DollarSign, User, MoreHorizontal, AlertCircle, KanbanSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWirePipeline, DEFAULT_STAGES, type DealFormData } from '@/hooks/useWirePipeline';
import { DealDialog } from './DealDialog';
import type { WireOpportunity, WirePipelineStage } from '@/types/wire.types';

function fmtDate(d?: string) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface OpportunityCardProps {
  opp: WireOpportunity;
  stages: WirePipelineStage[];
  onEdit: (o: WireOpportunity) => void;
  onDelete: (o: WireOpportunity) => void;
  onMove: (id: string, stageId: string) => void;
}

function OpportunityCard({ opp, stages, onEdit, onDelete, onMove }: OpportunityCardProps) {
  return (
    <div className="bg-white border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow space-y-2 group">
      <div className="flex items-start justify-between gap-1">
        <p className="text-sm font-semibold leading-tight flex-1">{opp.name}</p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-gray-100">
              <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => onEdit(opp)}>Edit Deal</DropdownMenuItem>
            <DropdownMenuSeparator />
            {stages
              .filter((s) => s.id !== opp.stage_id)
              .map((s) => (
                <DropdownMenuItem key={s.id} onClick={() => onMove(opp.id, s.id)}>
                  Move → {s.name}
                </DropdownMenuItem>
              ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(opp)}
              className="text-red-600 focus:text-red-600"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {opp.value != null && (
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
        <p className="text-xs text-muted-foreground">Close: {fmtDate(opp.close_date)}</p>
      )}
    </div>
  );
}

interface PipelineColumnProps {
  stage: WirePipelineStage;
  opportunities: WireOpportunity[];
  allStages: WirePipelineStage[];
  onAddDeal: (stageId: string) => void;
  onEdit: (o: WireOpportunity) => void;
  onDelete: (o: WireOpportunity) => void;
  onMove: (id: string, stageId: string) => void;
}

function PipelineColumn({ stage, opportunities, allStages, onAddDeal, onEdit, onDelete, onMove }: PipelineColumnProps) {
  const total = opportunities.reduce((sum, o) => sum + (o.value ?? 0), 0);

  return (
    <div className="flex flex-col min-w-[220px] max-w-[220px]">
      <div className="flex items-center gap-2 mb-1">
        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
        <h3 className="text-sm font-semibold">{stage.name}</h3>
        <span className="text-xs text-muted-foreground bg-gray-100 px-1.5 py-0.5 rounded-full">
          {opportunities.length}
        </span>
      </div>
      {total > 0 && (
        <p className="text-xs text-muted-foreground mb-3">${total.toLocaleString()} total</p>
      )}
      <div className="flex-1 space-y-2 min-h-[200px]">
        {opportunities.map((opp) => (
          <OpportunityCard
            key={opp.id}
            opp={opp}
            stages={allStages}
            onEdit={onEdit}
            onDelete={onDelete}
            onMove={onMove}
          />
        ))}
        <button
          onClick={() => onAddDeal(stage.id)}
          className="w-full border-2 border-dashed border-gray-200 rounded-lg p-2 text-xs text-muted-foreground hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-1"
        >
          <Plus className="h-3 w-3" />
          Add Deal
        </button>
      </div>
    </div>
  );
}

export function WirePipeline() {
  const { opportunities, loading, error, addDeal, updateDeal, moveDeal, deleteDeal } = useWirePipeline();

  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDeal, setEditDeal] = useState<WireOpportunity | null>(null);
  const [defaultStage, setDefaultStage] = useState('s1');
  const [deletingDeal, setDeletingDeal] = useState<WireOpportunity | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [listStageFilter, setListStageFilter] = useState<string>('all');

  const totalValue = opportunities.reduce((sum, o) => sum + (o.value ?? 0), 0);

  const openAdd = (stageId = 's1') => {
    setEditDeal(null);
    setDefaultStage(stageId);
    setDialogOpen(true);
  };

  const openEdit = (opp: WireOpportunity) => {
    setEditDeal(opp);
    setDialogOpen(true);
  };

  const handleSave = async (data: DealFormData) => {
    if (editDeal) {
      await updateDeal(editDeal.id, data);
    } else {
      await addDeal(data);
    }
  };

  const handleDelete = async () => {
    if (!deletingDeal) return;
    setDeleting(true);
    try {
      await deleteDeal(deletingDeal.id);
    } finally {
      setDeleting(false);
      setDeletingDeal(null);
    }
  };

  const filteredList = listStageFilter === 'all'
    ? opportunities
    : opportunities.filter((o) => o.stage_id === listStageFilter);

  return (
    <div className="p-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold">Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading
              ? 'Loading...'
              : `${opportunities.length} deals · $${totalValue.toLocaleString()} total value`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border rounded-lg overflow-hidden">
            <button
              onClick={() => setView('kanban')}
              className={cn('px-3 py-1.5 text-xs font-medium transition-colors',
                view === 'kanban' ? 'bg-gray-900 text-white' : 'hover:bg-gray-100')}
            >
              Kanban
            </button>
            <button
              onClick={() => setView('list')}
              className={cn('px-3 py-1.5 text-xs font-medium transition-colors',
                view === 'list' ? 'bg-gray-900 text-white' : 'hover:bg-gray-100')}
            >
              List
            </button>
          </div>
          <Button size="sm" onClick={() => openAdd()} className="bg-gray-900 hover:bg-gray-700 text-white gap-1.5">
            <Plus className="h-4 w-4" />
            New Deal
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex gap-5 overflow-x-auto pb-4">
          {DEFAULT_STAGES.map((s) => (
            <div key={s.id} className="min-w-[220px] space-y-2">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          ))}
        </div>
      ) : view === 'kanban' ? (
        <div className="flex gap-5 overflow-x-auto pb-4 flex-1">
          {DEFAULT_STAGES.map((stage) => {
            const stageOpps = opportunities.filter((o) => o.stage_id === stage.id);
            return (
              <PipelineColumn
                key={stage.id}
                stage={stage}
                opportunities={stageOpps}
                allStages={DEFAULT_STAGES}
                onAddDeal={openAdd}
                onEdit={openEdit}
                onDelete={setDeletingDeal}
                onMove={moveDeal}
              />
            );
          })}
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <Select value={listStageFilter} onValueChange={setListStageFilter}>
              <SelectTrigger className="w-44 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {DEFAULT_STAGES.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">{filteredList.length} deals</span>
          </div>

          {filteredList.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <KanbanSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-base font-medium">No deals yet</p>
              <p className="text-sm mt-1">Create your first deal to get started.</p>
              <Button onClick={() => openAdd()} className="mt-4 bg-gray-900 hover:bg-gray-700 text-white gap-2">
                <Plus className="h-4 w-4" /> New Deal
              </Button>
            </div>
          ) : (
            <div className="overflow-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Deal</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Stage</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Value</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Assigned</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Close Date</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((opp) => {
                    const stage = DEFAULT_STAGES.find((s) => s.id === opp.stage_id);
                    return (
                      <tr key={opp.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{opp.name}</td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: stage?.color }} />
                            {stage?.name}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-green-700">
                          {opp.value != null ? `$${opp.value.toLocaleString()}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{opp.assigned_to ?? '—'}</td>
                        <td className="px-4 py-3 text-muted-foreground">{fmtDate(opp.close_date) ?? '—'}</td>
                        <td className="px-4 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(opp)}>Edit</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeletingDeal(opp)}
                                className="text-red-600 focus:text-red-600"
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <DealDialog
        open={dialogOpen}
        deal={editDeal}
        defaultStageId={defaultStage}
        onClose={() => { setDialogOpen(false); setEditDeal(null); }}
        onSave={handleSave}
      />

      <AlertDialog open={!!deletingDeal} onOpenChange={(o) => !o && setDeletingDeal(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Deal?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deletingDeal?.name}". This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? 'Deleting...' : 'Delete Deal'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
