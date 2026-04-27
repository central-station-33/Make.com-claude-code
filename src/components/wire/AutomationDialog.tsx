import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, ChevronRight, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WireAutomation, WireAutomationStep } from '@/types/wire.types';
import {
  TRIGGER_TYPES,
  ACTION_TEMPLATES,
  type AutomationFormData,
} from '@/hooks/useWireAutomations';

const STEP_COLORS: Record<WireAutomationStep['type'], string> = {
  trigger:   'bg-purple-100 text-purple-700 border-purple-200',
  action:    'bg-blue-100 text-blue-700 border-blue-200',
  condition: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  delay:     'bg-gray-100 text-gray-600 border-gray-200',
};

const DELAY_OPTIONS = [
  { label: '15 minutes', hours: 0.25 },
  { label: '1 hour',     hours: 1 },
  { label: '3 hours',    hours: 3 },
  { label: '1 day',      hours: 24 },
  { label: '3 days',     hours: 72 },
  { label: '7 days',     hours: 168 },
  { label: '14 days',    hours: 336 },
  { label: '30 days',    hours: 720 },
];

function newId() {
  return Math.random().toString(36).slice(2, 9);
}

interface AutomationDialogProps {
  open: boolean;
  automation?: WireAutomation | null;
  onClose: () => void;
  onSave: (data: AutomationFormData) => Promise<void>;
}

export function AutomationDialog({ open, automation, onClose, onSave }: AutomationDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState('contact_created');
  const [steps, setSteps] = useState<WireAutomationStep[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (automation) {
      setName(automation.name);
      setDescription(automation.description ?? '');
      setTriggerType(automation.trigger_type);
      setSteps(automation.steps.filter((s) => s.type !== 'trigger'));
    } else {
      setName('');
      setDescription('');
      setTriggerType('contact_created');
      setSteps([]);
    }
  }, [automation, open]);

  const addAction = (template: typeof ACTION_TEMPLATES[number]) => {
    setSteps((s) => [...s, { id: newId(), type: 'action', name: template.name, config: { ...template.config } }]);
  };

  const addDelay = () => {
    setSteps((s) => [...s, { id: newId(), type: 'delay', name: 'Wait 1 day', config: { hours: 24 } }]);
  };

  const removeStep = (id: string) => setSteps((s) => s.filter((step) => step.id !== id));

  const updateStepDelay = (id: string, hours: number, label: string) => {
    setSteps((s) => s.map((step) =>
      step.id === id ? { ...step, name: `Wait ${label}`, config: { hours } } : step
    ));
  };

  const triggerStep: WireAutomationStep = {
    id: 'trigger',
    type: 'trigger',
    name: TRIGGER_TYPES.find((t) => t.value === triggerType)?.label ?? triggerType,
    config: {},
  };

  const allSteps = [triggerStep, ...steps];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        name,
        description,
        status: automation?.status ?? 'draft',
        trigger_type: triggerType,
        steps: allSteps,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{automation ? 'Edit Automation' : 'New Automation'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Automation Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="New Lead Welcome Sequence"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Trigger</Label>
              <Select value={triggerType} onValueChange={setTriggerType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGER_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this automation do?"
              rows={2}
            />
          </div>

          {/* Step builder */}
          <div className="space-y-3">
            <Label>Steps</Label>

            {/* Trigger (fixed) */}
            <div className="flex items-center gap-2">
              <span className={cn('text-xs px-3 py-1.5 rounded-lg border font-medium', STEP_COLORS.trigger)}>
                Trigger: {triggerStep.name}
              </span>
            </div>

            {steps.length > 0 && (
              <div className="space-y-2 pl-4 border-l-2 border-dashed border-gray-200">
                {steps.map((step, idx) => (
                  <div key={step.id} className="flex items-center gap-2 group">
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <div className={cn('flex-1 flex items-center gap-2 text-xs px-3 py-2 rounded-lg border font-medium', STEP_COLORS[step.type])}>
                      <GripVertical className="h-3.5 w-3.5 opacity-40" />
                      <span className="flex-1">{step.name}</span>
                      {step.type === 'delay' && (
                        <Select
                          value={String(step.config.hours)}
                          onValueChange={(v) => {
                            const opt = DELAY_OPTIONS.find((o) => String(o.hours) === v);
                            if (opt) updateStepDelay(step.id, opt.hours, opt.label);
                          }}
                        >
                          <SelectTrigger className="h-6 w-28 text-xs border-0 bg-transparent p-0 focus:ring-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DELAY_OPTIONS.map((o) => (
                              <SelectItem key={o.hours} value={String(o.hours)}>{o.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeStep(step.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add step buttons */}
            <div className="space-y-2 pt-1">
              <p className="text-xs text-muted-foreground font-medium">Add a step:</p>
              <div className="flex flex-wrap gap-2">
                {ACTION_TEMPLATES.map((t) => (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => addAction(t)}
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    {t.name}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={addDelay}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Add Delay
                </button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-gray-900 hover:bg-gray-700 text-white">
              {saving ? 'Saving...' : automation ? 'Save Changes' : 'Create Automation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
