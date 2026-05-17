import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Bot, Search, RefreshCw, Eye, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type Mention = {
  engine: string;
  query: string;
  intent?: string;
  mentions_brand: boolean;
  position?: number;
  snippet?: string;
  sentiment?: string;
  context?: string;
  recommendation_strength?: string;
  competitor_mentions?: string[];
  full_response_preview?: string;
};

type Insights = {
  overall_visibility_score?: number;
  engine_scores?: Record<string, number>;
  total_mentions?: number;
  mention_rate?: number;
  avg_position?: number;
  sentiment_breakdown?: Record<string, number>;
  top_insights?: string[];
  improvement_actions?: string[];
  competitive_gap?: string;
};

const engineColors: Record<string, string> = {
  ChatGPT: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  Claude: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  Perplexity: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  Gemini: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
};

const sentimentColors: Record<string, string> = {
  positive: "text-green-600",
  neutral: "text-muted-foreground",
  negative: "text-red-500",
};

const strengthColors: Record<string, string> = {
  strong: "text-green-600",
  moderate: "text-yellow-600",
  weak: "text-orange-500",
  none: "text-red-500",
};

export default function SearchMonitor() {
  const { toast } = useToast();
  const [brand, setBrand] = useState("");
  const [keyword, setKeyword] = useState("");
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [scanned, setScanned] = useState(false);

  const handleScan = async () => {
    if (!brand.trim() || !keyword.trim()) return;
    setLoading(true);
    setScanned(false);

    try {
      const { data, error } = await supabase.functions.invoke("ai-search-monitor", {
        body: { brand, keyword },
      });
      if (error) throw error;

      const result = data as { mentions: Mention[]; insights: Insights };
      setMentions(result.mentions ?? []);
      setInsights(result.insights ?? null);
      setScanned(true);
      const visScore = result.insights?.overall_visibility_score ?? 0;
      toast({ title: "Scan complete", description: `AI visibility score: ${visScore}/100` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({ title: "Scan failed", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const filtered = filter === "all" ? mentions : filter === "mentioned" ? mentions.filter(m => m.mentions_brand) : mentions.filter(m => m.engine === filter);
  const mentionedCount = mentions.filter(m => m.mentions_brand).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-violet-500" />
            AI Search Monitor Agent
          </CardTitle>
          <CardDescription>
            Claude simulates how each AI engine responds to queries about your keyword and evaluates whether your brand is mentioned, in what position, and with what sentiment.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Brand / Business Name</Label>
              <Input placeholder="e.g. Jet Realty Advisors" value={brand} onChange={e => setBrand(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Target Keyword / Topic</Label>
              <Input placeholder="e.g. real estate advisor" value={keyword} onChange={e => setKeyword(e.target.value)} />
            </div>
          </div>
          <Button onClick={handleScan} disabled={loading || !brand.trim() || !keyword.trim()} className="w-full">
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Claude scanning AI engines...</> : <><Search className="h-4 w-4 mr-2" /> Scan AI Search Engines</>}
          </Button>
        </CardContent>
      </Card>

      {scanned && insights && (
        <>
          {/* Visibility score + engine breakdown */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="col-span-2 lg:col-span-1">
              <CardContent className="pt-6 flex flex-col items-center justify-center text-center">
                <div className="text-5xl font-bold text-violet-600">{insights.overall_visibility_score ?? 0}</div>
                <div className="text-sm text-muted-foreground mt-1">Overall AI Visibility Score</div>
                <Progress value={insights.overall_visibility_score ?? 0} className="mt-3 w-full" />
                <div className="mt-3 text-xs text-muted-foreground">
                  {mentionedCount}/{mentions.length} queries — {insights.mention_rate ?? 0}% mention rate
                </div>
              </CardContent>
            </Card>

            {insights.engine_scores && Object.entries(insights.engine_scores).map(([engine, score]) => (
              <Card key={engine}>
                <CardContent className="pt-4 pb-4">
                  <Badge className={`text-xs mb-2 ${engineColors[engine] ?? ""}`} variant="secondary">{engine}</Badge>
                  <div className="text-2xl font-bold">{score}</div>
                  <Progress value={score} className="mt-2 h-1" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Insights */}
          {(insights.top_insights?.length || insights.improvement_actions?.length) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {insights.top_insights?.length && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Key Findings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {insights.top_insights.map((s, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />{s}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
              {insights.improvement_actions?.length && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Improvement Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {insights.improvement_actions.map((a, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 shrink-0 mt-0.5" />{a}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Mention feed */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle className="text-base">Query-by-Query Results ({filtered.length})</CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Queries</SelectItem>
                      <SelectItem value="mentioned">Brand Mentioned</SelectItem>
                      {Object.keys(engineColors).map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="outline" onClick={handleScan} disabled={loading}>
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4 space-y-4">
              {filtered.map((m, i) => (
                <div key={i} className="space-y-2 pb-4 border-b last:border-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className={`text-xs ${engineColors[m.engine] ?? ""}`}>{m.engine}</Badge>
                      {m.mentions_brand
                        ? <Badge variant="default" className="text-xs bg-green-600">Mentioned #{m.position ?? "?"}</Badge>
                        : <Badge variant="outline" className="text-xs text-red-500 border-red-300">Not Mentioned</Badge>}
                      {m.intent && <Badge variant="outline" className="text-xs">{m.intent}</Badge>}
                    </div>
                    {m.recommendation_strength && m.mentions_brand && (
                      <span className={`text-xs font-semibold ${strengthColors[m.recommendation_strength] ?? ""}`}>
                        {m.recommendation_strength} recommendation
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground">Query: <span className="italic">"{m.query}"</span></p>

                  {m.mentions_brand && m.snippet && (
                    <div className="bg-muted/50 rounded-md px-3 py-2 text-sm leading-relaxed">
                      {m.snippet}
                      {m.sentiment && (
                        <span className={`ml-2 text-xs font-medium ${sentimentColors[m.sentiment] ?? ""}`}>({m.sentiment})</span>
                      )}
                    </div>
                  )}

                  {m.full_response_preview && (
                    <p className="text-xs text-muted-foreground italic border-l-2 pl-2">"{m.full_response_preview}..."</p>
                  )}

                  {m.competitor_mentions && m.competitor_mentions.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Also mentioned:</span>
                      {m.competitor_mentions.map((c, j) => <Badge key={j} variant="outline" className="text-xs">{c}</Badge>)}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}

      {!scanned && !loading && (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
          <Bot className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">Enter your brand and keyword to let Claude monitor your AI search presence.</p>
        </div>
      )}
    </div>
  );
}
