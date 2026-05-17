import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ChevronDown, ChevronUp, CheckSquare, Square, Target, Bot, Loader2, Sparkles } from "lucide-react";
import { PILLARS, KEYWORDS, ROADMAP, KPIS, AI_CITATION_QUERIES } from "./content-plan-data";

const colorMap: Record<string, string> = {
  blue:   "border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20",
  green:  "border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-950/20",
  orange: "border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20",
  violet: "border-violet-300 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/20",
  sky:    "border-sky-300 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/20",
  yellow: "border-yellow-300 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20",
  red:    "border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/20",
};

const priorityColors: Record<string, string> = {
  "Month 1": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  "Month 2": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  "Month 3": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
};

const roadmapColors: Record<string, string> = {
  blue:   "border-blue-400 bg-blue-600",
  green:  "border-green-400 bg-green-600",
  violet: "border-violet-400 bg-violet-600",
};

const categoryColors: Record<string, string> = {
  Technical:    "text-blue-600",
  Content:      "text-green-600",
  "F50SEO":     "text-violet-600",
  YouTube:      "text-red-600",
  Citations:    "text-orange-600",
  Automation:   "text-sky-600",
  CRM:          "text-pink-600",
  Analytics:    "text-yellow-600",
  "AI Monitoring": "text-purple-600",
  Backlinks:    "text-teal-600",
};

export default function ContentPlan() {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [seeding, setSeeding] = useState(false);

  const toggleCheck = useCallback((key: string) =>
    setChecked(prev => ({ ...prev, [key]: !prev[key] })), []);

  const handleSeedQueue = async () => {
    setSeeding(true);
    try {
      const { error } = await supabase.functions.invoke("seed-content-plan", {
        body: { brand: "JET Realty Advisors", market: "NJ/NY" },
      });
      if (error) throw error;
      toast({
        title: "Week 1 content seeded",
        description: "10 drafts added to your Review Queue — ready to approve and publish.",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({ title: "Seed failed", description: msg, variant: "destructive" });
    } finally {
      setSeeding(false);
    }
  };

  const toggle = (id: number) =>
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-black dark:border-white">
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black tracking-tight">F50SEO Master Content Plan</h2>
              <p className="text-sm text-muted-foreground mt-1">
                JET Realty Advisors · NY/NJ Market · 7 Pillars · 70+ Cluster Articles · 90-Day Roadmap
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs">Traditional SEO</Badge>
              <Badge variant="outline" className="text-xs">AEO</Badge>
              <Badge variant="outline" className="text-xs">GEO</Badge>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            {[
              { value: "7", label: "Content Pillars" },
              { value: "70+", label: "Cluster Articles" },
              { value: "90", label: "Day Launch Plan" },
              { value: "4", label: "AI Engines Targeted" },
            ].map(s => (
              <div key={s.label}>
                <div className="text-3xl font-black">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pillars */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold">The 7 F50SEO Content Pillars</h3>

        {PILLARS.map(pillar => {
          const isOpen = expanded[pillar.id] ?? false;
          return (
            <Card key={pillar.id} className={`border ${colorMap[pillar.color]}`}>
              <CardContent className="pt-4 pb-4 space-y-3">
                {/* Pillar header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="text-2xl shrink-0 mt-0.5">{pillar.icon}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-bold">Pillar {pillar.id}:</span>
                        <span className="text-sm font-bold">{pillar.title}</span>
                        <Badge variant="secondary" className={`text-xs ${priorityColors[pillar.priority]}`}>
                          {pillar.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{pillar.description}</p>
                      <p className="text-xs font-mono text-muted-foreground mt-1 truncate">
                        {pillar.pillarPage}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm" variant="ghost"
                    className="h-7 w-7 p-0 shrink-0"
                    onClick={() => toggle(pillar.id)}
                  >
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>

                {/* Expanded cluster list */}
                {isOpen && (
                  <div className="space-y-2 pt-1">
                    {pillar.neighborhoods.nj.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">Target Markets</p>
                        <div className="flex flex-wrap gap-1.5">
                          {pillar.neighborhoods.nj.map(n => (
                            <Badge key={n} variant="outline" className="text-xs">{n}, NJ</Badge>
                          ))}
                          {pillar.neighborhoods.ny.map(n => (
                            <Badge key={n} variant="outline" className="text-xs">{n}, NY</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">
                        Cluster Articles ({pillar.clusters.length})
                      </p>
                      <div className="space-y-1">
                        {pillar.clusters.map((c, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <span className="text-xs text-muted-foreground font-mono w-5 shrink-0 mt-0.5">
                              {i + 1}.
                            </span>
                            <span className="text-muted-foreground">{c}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Part 2: Keyword Matrix ── */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold">F50SEO Keyword Priority Matrix</h3>

        {/* Tier 1 */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-red-600 text-white text-xs">Tier 1</Badge>
              <CardTitle className="text-sm">High Priority — Launch Month 1</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 text-xs font-semibold text-muted-foreground uppercase">Keyword</th>
                    <th className="text-left py-2 pr-4 text-xs font-semibold text-muted-foreground uppercase">Intent</th>
                    <th className="text-left py-2 text-xs font-semibold text-muted-foreground uppercase">Pillar</th>
                  </tr>
                </thead>
                <tbody>
                  {KEYWORDS.tier1.map((k, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">{k.keyword}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{k.intent}</td>
                      <td className="py-2"><Badge variant="outline" className="text-xs">{k.pillar}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Tier 2 */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-yellow-500 text-white text-xs">Tier 2</Badge>
              <CardTitle className="text-sm">Cluster Content — Months 1–2</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 text-xs font-semibold text-muted-foreground uppercase">Keyword</th>
                    <th className="text-left py-2 pr-4 text-xs font-semibold text-muted-foreground uppercase">Intent</th>
                    <th className="text-left py-2 text-xs font-semibold text-muted-foreground uppercase">Pillar</th>
                  </tr>
                </thead>
                <tbody>
                  {KEYWORDS.tier2.map((k, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">{k.keyword}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{k.intent}</td>
                      <td className="py-2"><Badge variant="outline" className="text-xs">{k.pillar}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Tier 3 */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-green-600 text-white text-xs">Tier 3</Badge>
              <CardTitle className="text-sm">AEO / GEO Long-Tail — Months 2–3</CardTitle>
            </div>
            <CardDescription className="text-xs">Conversational queries that AI tools answer directly — structured as questions on F50SEO pages.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {KEYWORDS.tier3.map((q, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-muted-foreground font-mono text-xs w-5 shrink-0 mt-0.5">{i + 1}.</span>
                  <span className="italic text-muted-foreground">"{q}"</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Part 3: 90-Day Roadmap ── */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold">F50SEO 90-Day Launch Roadmap</h3>

        {ROADMAP.map(month => {
          const doneCount = month.tasks.filter((_, i) => checked[`${month.month}-${i}`]).length;
          const pct = Math.round((doneCount / month.tasks.length) * 100);

          return (
            <Card key={month.month}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-black ${roadmapColors[month.color].split(" ")[1]}`}>
                      {month.month}
                    </div>
                    <div>
                      <CardTitle className="text-base">Month {month.month}: {month.label}</CardTitle>
                      <CardDescription className="text-xs">{month.phase}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{doneCount}/{month.tasks.length} tasks</span>
                    <Badge variant={pct === 100 ? "default" : "outline"} className="text-xs">{pct}%</Badge>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-3 space-y-1.5">
                {month.tasks.map((task, i) => {
                  const key = `${month.month}-${i}`;
                  const done = checked[key] ?? false;
                  return (
                    <button
                      key={key}
                      onClick={() => toggleCheck(key)}
                      className="flex items-start gap-2 w-full text-left hover:bg-muted/40 rounded px-2 py-1 transition-colors"
                    >
                      {done
                        ? <CheckSquare className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                        : <Square className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />}
                      <span className={`text-xs font-semibold w-20 shrink-0 ${categoryColors[task.category] ?? "text-muted-foreground"}`}>
                        [{task.category}]
                      </span>
                      <span className={`text-sm ${done ? "line-through text-muted-foreground" : ""}`}>
                        {task.text}
                      </span>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Part 4: KPI Dashboard ── */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold flex items-center gap-2">
          <Target className="h-4 w-4" /> Performance KPIs
        </h3>
        <Card>
          <CardContent className="pt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {["Metric", "Tool", "Month 3 Target", "Month 6 Target"].map(h => (
                      <th key={h} className="text-left py-2 pr-4 text-xs font-semibold text-muted-foreground uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {KPIS.map((k, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">{k.metric}</td>
                      <td className="py-2 pr-4 text-muted-foreground text-xs">{k.tool}</td>
                      <td className="py-2 pr-4">
                        <Badge variant="outline" className="text-xs text-yellow-700 border-yellow-400">{k.month3}</Badge>
                      </td>
                      <td className="py-2">
                        <Badge variant="outline" className="text-xs text-green-700 border-green-400">{k.month6}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Part 5: AI Citation Monitor Queries ── */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold flex items-center gap-2">
          <Bot className="h-4 w-4" /> Monthly AI Citation Monitoring Queries
        </h3>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground mb-3">
              Prompt these into ChatGPT, Perplexity, and Gemini monthly. Track whether JRA or F50SEO content is cited. Use the Search Monitor tab to automate.
            </p>
            <div className="space-y-2">
              {AI_CITATION_QUERIES.map((q, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/40 text-sm">
                  <span className="text-xs font-mono text-muted-foreground w-5 shrink-0 mt-0.5">{i + 1}.</span>
                  <span className="italic">"{q}"</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Part 6: Generate Week 1 Content ── */}
      <Card className="border-black dark:border-white">
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-black text-base">Generate Week 1 Content</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Seed your Review Queue with the first 10 AI-generated drafts — 2 pillar intros, 6 cluster articles, and 2 market reports — all written by Claude for JET Realty Advisors.
              </p>
            </div>
            <Button
              size="lg"
              onClick={handleSeedQueue}
              disabled={seeding}
              className="shrink-0 bg-black dark:bg-white text-white dark:text-black hover:bg-black/80 dark:hover:bg-white/80"
            >
              {seeding
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating drafts...</>
                : <><Sparkles className="h-4 w-4 mr-2" /> Generate Week 1 Drafts</>}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
