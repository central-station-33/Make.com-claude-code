import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Brain, TrendingUp, Target, Calendar, Lightbulb, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type Query = { query: string; volume?: string; type?: string; content_format?: string; location_modifier?: string; pain_point?: string };
type Gap = { topic: string; reason_underserved: string; opportunity_score: number; recommended_format: string; target_query: string };
type Cluster = { cluster_name: string; subtopics: string[]; search_volume_potential: string; ai_citation_likelihood: string; recommended_content_type: string };
type CalendarItem = { week: number; topic: string; format: string; priority: string };

type ResearchResult = {
  queries: {
    high_intent_queries?: Query[];
    informational_queries?: Query[];
    pain_point_queries?: Query[];
    primary_intent?: string;
    buyer_journey_stage?: string;
  };
  gaps: {
    gaps?: Gap[];
    quick_wins?: { action: string; estimated_impact: string; effort: string }[];
    competitive_opportunities?: string[];
  };
  clusters: {
    pillar_topic?: string;
    pillar_description?: string;
    clusters?: Cluster[];
    content_calendar?: CalendarItem[];
  };
};

const priorityColors: Record<string, string> = {
  high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  low: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
};

const effortColors: Record<string, string> = {
  low: "text-green-600",
  medium: "text-yellow-600",
  high: "text-red-600",
};

export default function IntentResearch() {
  const { toast } = useToast();
  const [brand, setBrand] = useState("");
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"queries" | "gaps" | "clusters" | "calendar">("queries");

  const handleResearch = async () => {
    if (!brand.trim() || !topic.trim() || !audience.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("ai-intent-research", {
        body: { brand, topic, audience },
      });
      if (error) throw error;
      setResult(data as ResearchResult);
      toast({ title: "Research complete", description: "Intent, gaps, and topic clusters ready" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({ title: "Research failed", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { key: "queries", label: "Search Queries", icon: Target },
    { key: "gaps", label: "Content Gaps", icon: Lightbulb },
    { key: "clusters", label: "Topic Clusters", icon: Brain },
    { key: "calendar", label: "Content Calendar", icon: Calendar },
  ] as const;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-500" />
            Intent Research Agent
          </CardTitle>
          <CardDescription>
            Three parallel Claude agents research real search queries, identify content gaps, and build a topic cluster strategy to dominate AI search results.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Brand / Business Name</Label>
              <Input placeholder="Jet Realty Advisors" value={brand} onChange={e => setBrand(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Topic / Service</Label>
              <Input placeholder="Real estate advisory" value={topic} onChange={e => setTopic(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Target Audience</Label>
              <Input placeholder="First-time home buyers" value={audience} onChange={e => setAudience(e.target.value)} />
            </div>
          </div>
          <Button onClick={handleResearch} disabled={loading || !brand.trim() || !topic.trim() || !audience.trim()} className="w-full">
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> 3 agents researching in parallel...</> : <><Brain className="h-4 w-4 mr-2" /> Run Intent Research</>}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <div className="flex gap-2 flex-wrap">
              {tabs.map(t => (
                <Button
                  key={t.key}
                  size="sm"
                  variant={activeTab === t.key ? "default" : "outline"}
                  onClick={() => setActiveTab(t.key)}
                  className="flex items-center gap-1.5"
                >
                  <t.icon className="h-3.5 w-3.5" />
                  {t.label}
                </Button>
              ))}
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">

            {activeTab === "queries" && result.queries && (
              <div className="space-y-5">
                {result.queries.primary_intent && (
                  <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-900">
                    <p className="text-xs font-semibold text-violet-700 dark:text-violet-300 uppercase mb-1">Primary Intent</p>
                    <p className="text-sm">{result.queries.primary_intent}</p>
                    {result.queries.buyer_journey_stage && (
                      <Badge className="mt-2 capitalize" variant="secondary">{result.queries.buyer_journey_stage} stage</Badge>
                    )}
                  </div>
                )}
                {[
                  { key: "high_intent_queries", label: "High-Intent Queries", color: "text-red-600" },
                  { key: "informational_queries", label: "Informational Queries", color: "text-blue-600" },
                  { key: "pain_point_queries", label: "Pain Point Queries", color: "text-yellow-600" },
                ].map(({ key, label, color }) => {
                  const qs = result.queries[key as keyof typeof result.queries] as Query[] | undefined;
                  if (!qs?.length) return null;
                  return (
                    <div key={key}>
                      <p className={`text-sm font-semibold mb-2 ${color}`}>{label}</p>
                      <div className="space-y-2">
                        {qs.map((q, i) => (
                          <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/40 text-sm">
                            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <span className="font-medium">"{q.query}"</span>
                              <div className="flex gap-1 mt-1 flex-wrap">
                                {q.volume && <Badge variant="outline" className="text-xs">{q.volume} volume</Badge>}
                                {q.type && <Badge variant="outline" className="text-xs">{q.type}</Badge>}
                                {q.content_format && <Badge variant="outline" className="text-xs">{q.content_format}</Badge>}
                                {q.pain_point && <span className="text-xs text-muted-foreground">→ {q.pain_point}</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === "gaps" && result.gaps && (
              <div className="space-y-5">
                {result.gaps.quick_wins?.length && (
                  <div>
                    <p className="text-sm font-semibold mb-2 text-green-700 dark:text-green-400">Quick Wins</p>
                    <div className="space-y-2">
                      {result.gaps.quick_wins.map((w, i) => (
                        <div key={i} className="flex items-start justify-between gap-3 p-3 rounded-lg border">
                          <div>
                            <p className="text-sm font-medium">{w.action}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{w.estimated_impact}</p>
                          </div>
                          <span className={`text-xs font-semibold ${effortColors[w.effort] ?? ""}`}>{w.effort} effort</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {result.gaps.gaps?.length && (
                  <div>
                    <p className="text-sm font-semibold mb-2">Content Gap Opportunities</p>
                    <div className="space-y-3">
                      {result.gaps.gaps.map((gap, i) => (
                        <div key={i} className="p-3 rounded-lg border space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium">{gap.topic}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">{gap.recommended_format}</Badge>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <TrendingUp className="h-3 w-3" /> {gap.opportunity_score}/10
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">{gap.reason_underserved}</p>
                          <p className="text-xs text-blue-600 dark:text-blue-400">Target: "{gap.target_query}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "clusters" && result.clusters && (
              <div className="space-y-4">
                {result.clusters.pillar_topic && (
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase mb-1">Pillar Topic</p>
                    <p className="text-sm font-semibold">{result.clusters.pillar_topic}</p>
                    {result.clusters.pillar_description && <p className="text-xs text-muted-foreground mt-1">{result.clusters.pillar_description}</p>}
                  </div>
                )}
                <div className="space-y-3">
                  {result.clusters.clusters?.map((cluster, i) => (
                    <div key={i} className="p-3 rounded-lg border space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="text-sm font-semibold">{cluster.cluster_name}</p>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-xs">{cluster.search_volume_potential} volume</Badge>
                          <Badge variant={cluster.ai_citation_likelihood === "high" ? "default" : "secondary"} className="text-xs">
                            {cluster.ai_citation_likelihood} AI citation
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {cluster.subtopics?.map((st, j) => (
                          <Badge key={j} variant="outline" className="text-xs">{st}</Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">Format: {cluster.recommended_content_type}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "calendar" && result.clusters?.content_calendar && (
              <div className="space-y-2">
                {result.clusters.content_calendar.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                    <div className="w-14 text-center shrink-0">
                      <p className="text-xs text-muted-foreground">Week</p>
                      <p className="text-lg font-bold">{item.week}</p>
                    </div>
                    <Separator orientation="vertical" className="h-10" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.topic}</p>
                      <p className="text-xs text-muted-foreground">{item.format}</p>
                    </div>
                    <Badge className={`text-xs ${priorityColors[item.priority] ?? ""}`} variant="secondary">
                      {item.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

          </CardContent>
        </Card>
      )}
    </div>
  );
}
