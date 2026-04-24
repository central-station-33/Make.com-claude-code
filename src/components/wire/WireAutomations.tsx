import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Zap, Play, Pause, ChevronRight, Users, CheckCircle2 } from 'lucide-react';
import { mockAutomations } from './wireData';
import type { WireAutomation, WireAutomationStep } from '@/types/wire.types';
import { cn } from '@/lib/utils';

const STEP_COLORS: Record<WireAutomationStep['type'], string> = {
  trigger: 'bg-purple-100 text-purple-700 border-purple-200',
  action: 'bg-blue-100 text-blue-700 border-blue-200',
  condition: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  delay: 'bg-gray-100 text-gray-600 border-gray-200',
};

function AutomationCard({ automation }: { automation: WireAutomation }) {
  const completionRate =
    automation.enrolled_count > 0
      ? Math.round((automation.completed_count / automation.enrolled_count) * 100)
      : 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div
              className={cn(
                'h-10 w-10 rounded-xl flex items-center justify-center shrink-0',
                automation.status === 'active' ? 'bg-green-100' : 'bg-gray-100'
              )}
            >
              <Zap
                className={cn(
                  'h-5 w-5',
                  automation.status === 'active' ? 'text-green-600' : 'text-gray-400'
                )}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm">{automation.name}</p>
                <Badge
                  variant="outline"
                  className={cn(
                    'capitalize text-xs',
                    automation.status === 'active'
                      ? 'border-green-400 text-green-700'
                      : automation.status === 'paused'
                      ? 'border-yellow-400 text-yellow-700'
                      : 'border-gray-400 text-gray-600'
                  )}
                >
                  {automation.status}
                </Badge>
              </div>
              {automation.description && (
                <p className="text-xs text-muted-foreground mt-1">{automation.description}</p>
              )}

              {/* Step flow */}
              <div className="flex items-center gap-1 mt-3 flex-wrap">
                {automation.steps.map((step, idx) => (
                  <div key={step.id} className="flex items-center gap-1">
                    <span
                      className={cn(
                        'text-xs px-2 py-0.5 rounded border font-medium',
                        STEP_COLORS[step.type]
                      )}
                    >
                      {step.name}
                    </span>
                    {idx < automation.steps.length - 1 && (
                      <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                    )}
                  </div>
                ))}
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
                <div className="text-xs text-muted-foreground">{completionRate}% rate</div>
              </div>

              <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                <div
                  className="bg-green-400 h-1.5 rounded-full"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {automation.status === 'active' ? (
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Pause className="h-4 w-4 text-yellow-600" />
              </Button>
            ) : (
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Play className="h-4 w-4 text-green-600" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function WireAutomations() {
  const active = mockAutomations.filter((a) => a.status === 'active').length;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Automations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {active} active · {mockAutomations.length} total
          </p>
        </div>
        <Button className="bg-gray-900 hover:bg-gray-700 text-white gap-2">
          <Plus className="h-4 w-4" />
          New Automation
        </Button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap">
        {(Object.entries(STEP_COLORS) as [WireAutomationStep['type'], string][]).map(
          ([type, cls]) => (
            <div key={type} className="flex items-center gap-1.5">
              <span className={cn('text-xs px-2 py-0.5 rounded border font-medium capitalize', cls)}>
                {type}
              </span>
            </div>
          )
        )}
      </div>

      <div className="space-y-4">
        {mockAutomations.map((automation) => (
          <AutomationCard key={automation.id} automation={automation} />
        ))}
      </div>
    </div>
  );
}
