import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Loader2, Zap, Plus, Trash2, TrendingUp, AlertTriangle, CheckCircle2, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type LeadInput = {
  id: string;
  name: string;
  email: string;
  notes: string;
  source: string;
  ai_source: string;
  search_query: string;
};

type Enrichment = {
  quality_score?: number;
  intent_level?: string;
  lead_type?: string;
  urgency?: string;
  recommended_action?: string;
  follow_up_message?: string;
  key_signals?: string[];
  risk_flags?: string[];
  estimated_value?: string;
  next_best_action?: string;
  ai_source_credibility?: number;
};

type EnrichedLead = LeadInput & { ai_enrichment?: Enrichment; enriched_at?: string };

type BatchInsights = {
  batch_summary?: string;
  avg_quality_score?: number;
  top_priority_count?: number;
  recommended_focus?: string;
  pipeline_value_estimate?: string;
  team_actions?: string[];
};

const qualityColor = (score?: number) => {
  if (!score) return "text-muted-foreground";
  if (score >= 75) return "text-green-600";
  if (score >= 50) return "text-yellow-600";
  return "text-red-500";
};

const intentColors: Record<string, string> = {
  high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  low: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
};

const urgencyColors: Record<string, string> = {
  immediate: "text-red-600 font-semibold",
  "short-term": "text-yellow-600 font-semibold",
  "long-term": "text-blue-600",
  unknown: "text-muted-foreground",
};

const emptyLead = (): LeadInput => ({
  id: crypto.randomUUID(),
  name: "",
  email: "",
  notes: "",
  source: "ai-search",
  ai_source: "Claude",
  search_query: "",
});

export default function LeadCaptureAgent() {
  const { toast } = useToast();
  const [leads, setLeads] = useState<LeadInput[]>([emptyLead()]);
  const [enriched, setEnriched] = useState<EnrichedLead[]>([]);
  const [batchInsights, setBatchInsights] = useState<BatchInsights | null>(null);
  const [loading, setLoading] = useState(false);

  const updateLead = (id: string, field: keyof LeadInput, value: string) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const addLead = () => setLeads(prev => [...prev, emptyLead()]);
  const removeLead = (id: string) => setLeads(prev => prev.filter(l => l.id !== id));

  const handleScore = async () => {
    const valid = leads.filter(l => l.name.trim() || l.email.trim());
    if (!valid.length) return;
    setLoading(true);
    setEnriched([]);
    setBatchInsights(null);

    try {
      const { data, error } = await supabase.functions.invoke("ai-lead-capture", {
        body: { leads: valid },
      });
      if (error) throw error;

      const result = data as { enriched_leads: EnrichedLead[]; batch_insights: BatchInsights };
      setEnriched(result.enriched_leads ?? []);
      setBatchInsights(result.batch_insights ?? null);
      toast({ title: "Leads scored", description: `${result.enriched_leads.length} leads enriched by AI` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({ title: "Scoring failed", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Lead Capture & Scoring Agent
          </CardTitle>
          <CardDescription>
            Claude scores each lead's quality, identifies intent signals, recommends next actions, and generates personalized follow-up messages — then aggregates batch pipeline insights.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            {leads.map((lead, i) => (
              <div key={lead.id} className="p-4 rounded-lg border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Lead {i + 1}</span>
                  </div>
                  {leads.length > 1 && (
                    <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive h-7 w-7 p-0" onClick={() => removeLead(lead.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Full Name</Label>
                    <Input placeholder="Jane Smith" value={lead.name} onChange={e => updateLead(lead.id, "name", e.target.value)} className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Email</Label>
                    <Input placeholder="jane@email.com" value={lead.email} onChange={e => updateLead(lead.id, "email", e.target.value)} className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">AI Engine Source</Label>
                    <Input placeholder="ChatGPT / Claude / Perplexity" value={lead.ai_source} onChange={e => updateLead(lead.id, "ai_source", e.target.value)} className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Search Query They Used</Label>
                    <Input placeholder="e.g. best real estate advisor near me" value={lead.search_query} onChange={e => updateLead(lead.id, "search_query", e.target.value)} className="h-8 text-sm" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Notes / Message</Label>
                  <Textarea placeholder="What did they say or ask?" rows={2} value={lead.notes} onChange={e => updateLead(lead.id, "notes", e.target.value)} className="text-sm resize-none" />
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={addLead} className="flex-1">
              <Plus className="h-4 w-4 mr-2" /> Add Lead
            </Button>
            <Button onClick={handleScore} disabled={loading || !leads.some(l => l.name.trim() || l.email.trim())} className="flex-1">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Scoring leads...</> : <><Zap className="h-4 w-4 mr-2" /> Score with AI</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {batchInsights && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Batch Pipeline Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {batchInsights.batch_summary && (
              <p className="text-sm text-muted-foreground">{batchInsights.batch_summary}</p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {batchInsights.avg_quality_score !== undefined && (
                <div className="text-center">
                  <div className={`text-3xl font-bold ${qualityColor(batchInsights.avg_quality_score)}`}>{batchInsights.avg_quality_score}</div>
                  <div className="text-xs text-muted-foreground">Avg Quality Score</div>
                </div>
              )}
              {batchInsights.top_priority_count !== undefined && (
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">{batchInsights.top_priority_count}</div>
                  <div className="text-xs text-muted-foreground">High Priority</div>
                </div>
              )}
              {batchInsights.pipeline_value_estimate && (
                <div className="text-center col-span-2">
                  <div className="text-lg font-bold text-green-600">{batchInsights.pipeline_value_estimate}</div>
                  <div className="text-xs text-muted-foreground">Pipeline Value Estimate</div>
                </div>
              )}
            </div>
            {batchInsights.team_actions?.length && (
              <div>
                <p className="text-sm font-semibold mb-2">Recommended Team Actions</p>
                <ul className="space-y-1.5">
                  {batchInsights.team_actions.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />{a}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {enriched.length > 0 && (
        <div className="space-y-4">
          {enriched.map((lead, i) => {
            const e = lead.ai_enrichment ?? {};
            return (
              <Card key={lead.id ?? i}>
                <CardContent className="pt-4 space-y-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <p className="font-semibold">{lead.name || "Unknown"}</p>
                      <p className="text-sm text-muted-foreground">{lead.email}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className={`text-2xl font-bold ${qualityColor(e.quality_score)}`}>{e.quality_score ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">quality</div>
                      {e.intent_level && <Badge className={`${intentColors[e.intent_level] ?? ""} text-xs`} variant="secondary">{e.intent_level} intent</Badge>}
                      {e.lead_type && <Badge variant="outline" className="text-xs">{e.lead_type}</Badge>}
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {e.urgency && (
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Urgency</p>
                        <p className={`text-sm ${urgencyColors[e.urgency] ?? ""}`}>{e.urgency}</p>
                      </div>
                    )}
                    {e.estimated_value && (
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Estimated Value</p>
                        <p className="text-sm">{e.estimated_value}</p>
                      </div>
                    )}
                    {e.recommended_action && (
                      <div className="col-span-2 sm:col-span-1">
                        <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Recommended Action</p>
                        <p className="text-sm">{e.recommended_action}</p>
                      </div>
                    )}
                    {e.next_best_action && (
                      <div className="col-span-2 sm:col-span-1">
                        <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Next Best Action</p>
                        <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">{e.next_best_action}</p>
                      </div>
                    )}
                  </div>

                  {e.follow_up_message && (
                    <div className="p-3 rounded-lg bg-muted/50 border space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">AI-Generated Follow-Up Message</p>
                      <p className="text-sm">{e.follow_up_message}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {e.key_signals?.length && (
                      <div>
                        <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">Key Signals</p>
                        <ul className="space-y-1">
                          {e.key_signals.map((s, j) => (
                            <li key={j} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <TrendingUp className="h-3 w-3 text-green-600" />{s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {e.risk_flags?.length && (
                      <div>
                        <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">Risk Flags</p>
                        <ul className="space-y-1">
                          {e.risk_flags.map((f, j) => (
                            <li key={j} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <AlertTriangle className="h-3 w-3 text-red-500" />{f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {e.ai_source_credibility !== undefined && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>AI Source Credibility ({lead.ai_source})</span>
                        <span>{e.ai_source_credibility}/100</span>
                      </div>
                      <Progress value={e.ai_source_credibility} className="h-1.5" />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
