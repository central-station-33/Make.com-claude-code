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
  Zap,
  Play,
  Pause,
  ChevronRight,
  Users,
  CheckCircle2,
  MoreHorizontal,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWireAutomations, TRIGGER_TYPES, type AutomationFormData } from '@/hooks/useWireAutomations';
import { AutomationDialog } from './AutomationDialog';
import type { WireAutomation, WireAutomationStep } from '@/types/wire.types';

const STEP_COLORS: Record<WireAutomationStep['type'], string> = {
  trigger:   'bg-purple-100 text-purple-700 border-purple-200',
  action:    'bg-blue-100 text-blue-700 border-blue-200',
  condition: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  delay:     'bg-gray-100 text-gray-600 border-gray-200',
};

function triggerLabel(type: string) {
  return TRIGGER_TYPES.find((t) => t.value === type)?.label ?? type;
}

interface AutomationCardProps {
  automation: WireAutomation;
  onEdit: (a: WireAutomation) => void;
  onDelete: (a: WireAutomation) => void;
  onToggle: (a: WireAutomation) => void;
}

function AutomationCard({ automation, onEdit, onDelete, onToggle }: AutomationCardProps) {
  const completionRate =
    automation.enrolled_count > 0
      ? Math.round((automation.completed_count / automation.enrolled_count) * 100)
      : 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={cn(
              'h-10 w-10 rounded-xl flex items-center justify-center shrink-0',
              automation.status === 'active' ? 'bg-green-100' : 'bg-gray-100'
            )}>
              <Zap className={cn('h-5 w-5', automation.status === 'active' ? 'text-green-600' : 'text-gray-400')} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm">{automation.name}</p>
                <Badge
                  variant="outline"
                  className={cn('capitalize text-xs',
                    automation.status === 'active'  ? 'border-green-400 text-green-700' :
                    automation.status === 'paused'  ? 'border-yellow-400 text-yellow-700' :
                    'border-gray-400 text-gray-600'
                  )}
                >
                  {automation.status}
                </Badge>
              </div>

              {automation.description && (
                <p className="text-xs text-muted-foreground mt-1">{automation.description}</p>
              )}

              <p className="text-xs text-muted-foreground mt-1">
                Trigger: <span className="font-medium">{triggerLabel(automation.trigger_type)}</span>
              </p>

              {/* Step flow */}
              <div className="flex items-center gap-1 mt-2.5 flex-wrap">
                {automation.steps.map((step, idx) => (
                  <div key={step.id} className="flex items-center gap-1">
                    <span className={cn('text-xs px-2 py-0.5 rounded border font-medium', STEP_COLORS[step.type])}>
                      {step.name}
                    </span>
                    {idx < automation.steps.length - 1 && (
                      <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                    )}
                  </div>
                ))}
                {automation.steps.length === 0 && (
                  <span className="text-xs text-muted-foreground italic">No steps configured</span>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  {automation.enrolled_count} enrolled
                </div>
                <div className="flex items-center gap-1.5 text-xs text-green-600">
                  <CheckCircle2 className="h-3 w-3" />
                  {automation.completed_count} completed
                </div>
                {automation.enrolled_count > 0 && (
                  <span className="text-xs text-muted-foreground">{completionRate}% rate</span>
                )}
              </div>

              {automation.enrolled_count > 0 && (
                <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                  <div
                    className="bg-green-400 h-1.5 rounded-full transition-all"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onToggle(automation)}
              title={automation.status === 'active' ? 'Pause' : 'Activate'}
            >
              {automation.status === 'active' ? (
                <Pause className="h-4 w-4 text-yellow-600" />
              ) : (
                <Play className="h-4 w-4 text-green-600" />
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(automation)}>Edit</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(automation)}
                  className="text-red-600 focus:text-red-600"
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function WireAutomations() {
  const { automations, loading, error, addAutomation, updateAutomation, setStatus, deleteAutomation } =
    useWireAutomations();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editAutomation, setEditAutomation] = useState<WireAutomation | null>(null);
  const [deletingAutomation, setDeletingAutomation] = useState<WireAutomation | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused' | 'draft'>('all');

  const openAdd = () => { setEditAutomation(null); setDialogOpen(true); };
  const openEdit = (a: WireAutomation) => { setEditAutomation(a); setDialogOpen(true); };

  const handleSave = async (data: AutomationFormData) => {
    if (editAutomation) {
      await updateAutomation(editAutomation.id, data);
    } else {
      await addAutomation(data);
    }
  };

  const handleToggle = async (a: WireAutomation) => {
    const next = a.status === 'active' ? 'paused' : 'active';
    await setStatus(a.id, next);
  };

  const handleDelete = async () => {
    if (!deletingAutomation) return;
    setDeleting(true);
    try {
      await deleteAutomation(deletingAutomation.id);
    } finally {
      setDeleting(false);
      setDeletingAutomation(null);
    }
  };

  const activeCount = automations.filter((a) => a.status === 'active').length;
  const filtered = statusFilter === 'all' ? automations : automations.filter((a) => a.status === statusFilter);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Automations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? 'Loading...' : `${activeCount} active · ${automations.length} total`}
          </p>
        </div>
        <Button onClick={openAdd} className="bg-gray-900 hover:bg-gray-700 text-white gap-2">
          <Plus className="h-4 w-4" />
          New Automation
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Status filter + step legend */}
      {!loading && (
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-1.5">
            {(['all', 'active', 'paused', 'draft'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={cn(
                  'text-xs px-3 py-1 rounded-full border font-medium capitalize transition-colors',
                  statusFilter === f ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 hover:bg-gray-100'
                )}
              >
                {f}
                {f !== 'all' && (
                  <span className="ml-1 text-gray-400">
                    ({automations.filter((a) => a.status === f).length})
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {(Object.entries(STEP_COLORS) as [WireAutomationStep['type'], string][]).map(([type, cls]) => (
              <div key={type} className="flex items-center gap-1.5">
                <span className={cn('text-xs px-2 py-0.5 rounded border font-medium capitalize', cls)}>{type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5 flex gap-3">
                <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-64" />
                  <div className="flex gap-2 mt-3">
                    <Skeleton className="h-5 w-24 rounded" />
                    <Skeleton className="h-5 w-20 rounded" />
                    <Skeleton className="h-5 w-28 rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Zap className="h-10 w-10 mx-auto mb-3 opacity-30" />
            {automations.length === 0 ? (
              <>
                <p className="text-base font-medium">No automations yet</p>
                <p className="text-sm mt-1">Create your first automation to start nurturing leads automatically.</p>
                <Button onClick={openAdd} className="mt-4 bg-gray-900 hover:bg-gray-700 text-white gap-2">
                  <Plus className="h-4 w-4" /> New Automation
                </Button>
              </>
            ) : (
              <p className="text-sm">No {statusFilter} automations.</p>
            )}
          </div>
        ) : (
          filtered.map((automation) => (
            <AutomationCard
              key={automation.id}
              automation={automation}
              onEdit={openEdit}
              onDelete={setDeletingAutomation}
              onToggle={handleToggle}
            />
          ))
        )}
      </div>

      <AutomationDialog
        open={dialogOpen}
        automation={editAutomation}
        onClose={() => { setDialogOpen(false); setEditAutomation(null); }}
        onSave={handleSave}
      />

      <AlertDialog open={!!deletingAutomation} onOpenChange={(o) => !o && setDeletingAutomation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Automation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deletingAutomation?.name}". This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
