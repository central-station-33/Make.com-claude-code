import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, XCircle, AlertCircle, Loader2, Search, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type GradeResult = {
  overall: number;
  categories: { name: string; score: number; feedback: string; pass: boolean }[];
  top_issues: string[];
  strengths: string[];
  ai_engines: { chatgpt: number; claude: number; perplexity: number; gemini: number };
  quick_wins: string[];
};

function ScoreRing({ score }: { score: number }) {
  const color = score >= 75 ? "text-green-600" : score >= 50 ? "text-yellow-500" : "text-red-500";
  const label = score >= 75 ? "Strong" : score >= 50 ? "Needs Work" : "Poor";
  return (
    <div className="flex flex-col items-center justify-center w-36 h-36 rounded-full border-4 border-muted bg-muted/30">
      <span className={`text-5xl font-bold ${color}`}>{score}</span>
      <span className="text-xs text-muted-foreground mt-1">{label}</span>
    </div>
  );
}

const engineColors: Record<string, string> = {
  chatgpt: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  claude: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  perplexity: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  gemini: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
};

export default function AISearchGrader() {
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [content, setContent] = useState("");
  const [result, setResult] = useState<GradeResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGrade = async () => {
    if (!content.trim() && !url.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("ai-content-generator", {
        body: { type: "grade", content, url },
      });

      if (error) throw error;

      const grade = data as GradeResult;
      setResult({
        overall: grade.overall ?? 50,
        categories: grade.categories ?? [],
        top_issues: grade.top_issues ?? [],
        strengths: grade.strengths ?? [],
        ai_engines: grade.ai_engines ?? { chatgpt: 0, claude: 0, perplexity: 0, gemini: 0 },
        quick_wins: grade.quick_wins ?? [],
      });
      toast({ title: "Analysis complete", description: `Overall AI search score: ${grade.overall}/100` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({ title: "Grading failed", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-500" />
            AI Search Grader Agent
          </CardTitle>
          <CardDescription>
            Claude analyzes your content across 6 dimensions and scores it against real AI search ranking criteria used by ChatGPT, Perplexity, and Gemini.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="url">Page URL (optional)</Label>
            <Input id="url" placeholder="https://yoursite.com/page" value={url} onChange={e => setUrl(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="content">Page Content</Label>
            <Textarea id="content" placeholder="Paste your page text, landing page copy, or blog post here..." rows={8} value={content} onChange={e => setContent(e.target.value)} />
          </div>
          <Button onClick={handleGrade} disabled={loading || (!content.trim() && !url.trim())} className="w-full">
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Claude is analyzing...</> : <><Search className="h-4 w-4 mr-2" /> Grade with Claude AI</>}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <ScoreRing score={result.overall} />
                  <span className="text-sm text-muted-foreground">Overall AI Score</span>
                </div>
                <div className="flex-1 space-y-4">
                  {/* Per-engine scores */}
                  {result.ai_engines && Object.keys(result.ai_engines).length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Per-Engine Scores</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {Object.entries(result.ai_engines).map(([engine, score]) => (
                          <div key={engine} className={`rounded-lg px-3 py-2 text-center ${engineColors[engine]}`}>
                            <div className="text-lg font-bold">{score}</div>
                            <div className="text-xs capitalize">{engine === "chatgpt" ? "ChatGPT" : engine.charAt(0).toUpperCase() + engine.slice(1)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category scores */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {result.categories.map(cat => (
                      <div key={cat.name} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-1.5">
                            {cat.pass ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : <XCircle className="h-3.5 w-3.5 text-red-500" />}
                            <span className="font-medium">{cat.name}</span>
                          </div>
                          <span className="text-muted-foreground">{cat.score}/100</span>
                        </div>
                        <Progress value={cat.score} className="h-1.5" />
                        <p className="text-xs text-muted-foreground">{cat.feedback}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {result.strengths.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-green-700 dark:text-green-400">Strengths</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {result.strengths.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />{s}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {result.top_issues.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-red-700 dark:text-red-400">Top Issues</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {result.top_issues.map((issue, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <AlertCircle className="h-3.5 w-3.5 text-yellow-500 shrink-0 mt-0.5" />{issue}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {result.quick_wins.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5" /> Quick Wins
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {result.quick_wins.map((win, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Zap className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />{win}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
