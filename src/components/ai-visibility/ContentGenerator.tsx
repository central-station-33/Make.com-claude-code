import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Loader2, Sparkles, Copy, Check, RefreshCw, CheckCircle2, Circle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type ContentType = "landing-page" | "blog-post" | "faq" | "guide";

const contentTypeLabels: Record<ContentType, string> = {
  "landing-page": "Landing Page",
  "blog-post": "Blog Post",
  "faq": "FAQ Page",
  "guide": "Step-by-Step Guide",
};

const AGENT_STEPS = ["Intent Research", "Content Structure", "Content Writing", "AI Optimization"];

type StepStatus = "pending" | "running" | "done";

type AgentStep = { step: string; output: string };

export default function ContentGenerator() {
  const { toast } = useToast();
  const [topic, setTopic] = useState("");
  const [brand, setBrand] = useState("");
  const [audience, setAudience] = useState("");
  const [type, setType] = useState<ContentType>("blog-post");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [steps, setSteps] = useState<{ name: string; status: StepStatus }[]>([]);
  const [intentData, setIntentData] = useState<Record<string, unknown> | null>(null);

  const updateStep = (index: number, status: StepStatus) => {
    setSteps(prev => prev.map((s, i) => i === index ? { ...s, status } : s));
  };

  const handleGenerate = async () => {
    if (!topic.trim() || !brand.trim() || !audience.trim()) return;
    setLoading(true);
    setOutput("");
    setIntentData(null);
    setSteps(AGENT_STEPS.map(name => ({ name, status: "pending" })));

    try {
      // Animate steps while waiting for the agent
      let stepIdx = 0;
      const stepTimer = setInterval(() => {
        setSteps(prev => prev.map((s, i) => {
          if (i < stepIdx) return { ...s, status: "done" };
          if (i === stepIdx) return { ...s, status: "running" };
          return s;
        }));
        stepIdx++;
        if (stepIdx >= AGENT_STEPS.length) clearInterval(stepTimer);
      }, 3500);

      const { data, error } = await supabase.functions.invoke("ai-content-generator", {
        body: { type, topic, brand, audience },
      });

      clearInterval(stepTimer);
      setSteps(AGENT_STEPS.map(name => ({ name, status: "done" })));

      if (error) throw error;

      const result = data as { steps: AgentStep[]; final: string; intent: Record<string, unknown> };
      setOutput(result.final ?? "");
      setIntentData(result.intent ?? null);
      toast({ title: "Content generated", description: `${contentTypeLabels[type]} created by 4-step AI agent` });
    } catch (err: unknown) {
      setSteps(AGENT_STEPS.map(name => ({ name, status: "pending" })));
      const msg = err instanceof Error ? err.message : String(err);
      toast({ title: "Generation failed", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const stepProgress = steps.filter(s => s.status === "done").length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-500" />
            AI Content Generation Agent
          </CardTitle>
          <CardDescription>
            A 4-step autonomous agent researches intent, structures content, writes in your brand voice, then optimizes for AI search ranking in ChatGPT, Claude, Perplexity, and Gemini.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Topic / Keyword</Label>
              <Input placeholder="e.g. First-Time Home Buying" value={topic} onChange={e => setTopic(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Brand / Business Name</Label>
              <Input placeholder="e.g. Jet Realty Advisors" value={brand} onChange={e => setBrand(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Target Audience</Label>
              <Input placeholder="e.g. First-Time Home Buyers" value={audience} onChange={e => setAudience(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Content Type</Label>
              <Select value={type} onValueChange={v => setType(v as ContentType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(contentTypeLabels) as ContentType[]).map(k => (
                    <SelectItem key={k} value={k}>{contentTypeLabels[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleGenerate} disabled={loading || !topic.trim() || !brand.trim() || !audience.trim()} className="w-full">
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Agent Running...</> : <><Sparkles className="h-4 w-4 mr-2" /> Run Content Agent</>}
          </Button>
        </CardContent>
      </Card>

      {steps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Agent Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={(stepProgress / AGENT_STEPS.length) * 100} className="h-1.5" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {steps.map((s, i) => (
                <div key={i} className={`flex items-center gap-2 p-2 rounded-lg border text-sm transition-all ${
                  s.status === "done" ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900" :
                  s.status === "running" ? "bg-violet-50 border-violet-200 dark:bg-violet-950/20 dark:border-violet-900" :
                  "bg-muted/30 border-border"
                }`}>
                  {s.status === "done" ? <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" /> :
                   s.status === "running" ? <Loader2 className="h-4 w-4 text-violet-500 shrink-0 animate-spin" /> :
                   <Circle className="h-4 w-4 text-muted-foreground shrink-0" />}
                  <span className={`text-xs font-medium leading-tight ${s.status === "running" ? "text-violet-700 dark:text-violet-300" : ""}`}>{s.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {intentData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Intent Research Results</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {intentData.primary_intent && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Primary Intent</p>
                <p className="text-sm">{String(intentData.primary_intent)}</p>
              </div>
            )}
            {intentData.content_angle && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Best Content Angle</p>
                <p className="text-sm">{String(intentData.content_angle)}</p>
              </div>
            )}
            {Array.isArray(intentData.pain_points) && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Pain Points Addressed</p>
                <div className="flex flex-wrap gap-1">
                  {(intentData.pain_points as string[]).slice(0, 4).map((p, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{p}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {output && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="space-y-1">
                <CardTitle className="text-base">Generated {contentTypeLabels[type]}</CardTitle>
                <div className="flex gap-2">
                  <Badge variant="secondary">4-Step AI Agent</Badge>
                  <Badge variant="outline">AI Search Optimized</Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleGenerate} disabled={loading}>
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Regenerate
                </Button>
                <Button size="sm" variant="outline" onClick={handleCopy}>
                  {copied ? <><Check className="h-3.5 w-3.5 mr-1.5 text-green-600" /> Copied</> : <><Copy className="h-3.5 w-3.5 mr-1.5" /> Copy</>}
                </Button>
              </div>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            <Textarea value={output} onChange={e => setOutput(e.target.value)} rows={30} className="font-mono text-sm resize-none" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
