import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, XCircle, AlertCircle, Loader2, Search } from "lucide-react";

type GradeResult = {
  overall: number;
  categories: { name: string; score: number; feedback: string; pass: boolean }[];
  topIssues: string[];
  strengths: string[];
};

function scoreContent(url: string, content: string): GradeResult {
  const text = content.toLowerCase();
  const wordCount = content.trim().split(/\s+/).length;

  const checks = [
    {
      name: "Content Clarity",
      score: wordCount > 300 ? 90 : wordCount > 150 ? 70 : 45,
      feedback: wordCount > 300 ? "Well-developed content with sufficient depth." : "Content is thin — aim for 300+ words.",
      pass: wordCount > 200,
    },
    {
      name: "Structured Headings",
      score: (text.includes("##") || text.includes("<h2") || text.includes("what") || text.includes("how")) ? 80 : 40,
      feedback: text.includes("##") || text.includes("<h") ? "Uses clear headings — great for AI parsing." : "Add H2/H3 headings to help AI engines structure your content.",
      pass: text.includes("##") || text.includes("<h"),
    },
    {
      name: "Entity Mentions",
      score: (text.includes("who") || text.includes("what") || text.includes("when") || text.includes("where")) ? 78 : 50,
      feedback: "Include explicit entity definitions (Who, What, Where) for AI comprehension.",
      pass: text.length > 100,
    },
    {
      name: "Question Coverage",
      score: text.includes("?") || text.includes("faq") || text.includes("how to") ? 85 : 38,
      feedback: text.includes("?") ? "Great — content answers natural questions AI users ask." : "Add FAQ sections or question-based headers to capture AI queries.",
      pass: text.includes("?") || text.includes("how to"),
    },
    {
      name: "Credibility Signals",
      score: (text.includes("years") || text.includes("certified") || text.includes("licensed") || text.includes("award") || text.includes("review")) ? 82 : 44,
      feedback: "Include credentials, testimonials, and trust signals — AI engines weight authority.",
      pass: text.includes("years") || text.includes("certified") || text.includes("review"),
    },
    {
      name: "URL / Page Structure",
      score: url.length > 0 && !url.includes(" ") ? 88 : 50,
      feedback: url.length > 0 ? "URL provided — ensure it uses descriptive slugs without stop words." : "Provide a URL for full page-level analysis.",
      pass: url.length > 5,
    },
  ];

  const overall = Math.round(checks.reduce((s, c) => s + c.score, 0) / checks.length);
  const topIssues = checks.filter((c) => !c.pass).map((c) => c.feedback);
  const strengths = checks.filter((c) => c.pass && c.score >= 78).map((c) => c.name);

  return { overall, categories: checks, topIssues, strengths };
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 75 ? "text-green-600" : score >= 50 ? "text-yellow-500" : "text-red-500";
  const label = score >= 75 ? "Strong" : score >= 50 ? "Needs Work" : "Poor";
  return (
    <div className="flex flex-col items-center justify-center w-32 h-32 rounded-full border-4 border-muted bg-muted/30">
      <span className={`text-4xl font-bold ${color}`}>{score}</span>
      <span className="text-xs text-muted-foreground mt-1">{label}</span>
    </div>
  );
}

export default function AISearchGrader() {
  const [url, setUrl] = useState("");
  const [content, setContent] = useState("");
  const [result, setResult] = useState<GradeResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGrade = () => {
    if (!content.trim() && !url.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setResult(scoreContent(url, content));
      setLoading(false);
    }, 1400);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Search Grader</CardTitle>
          <CardDescription>
            Paste your page content (or URL) to see how well it will perform in ChatGPT, Claude, Perplexity, and Gemini search results.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="url">Page URL (optional)</Label>
            <Input
              id="url"
              placeholder="https://yoursite.com/page"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="content">Page Content</Label>
            <Textarea
              id="content"
              placeholder="Paste your page text, landing page copy, or blog post here..."
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <Button onClick={handleGrade} disabled={loading || (!content.trim() && !url.trim())} className="w-full">
            {loading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing...</>
            ) : (
              <><Search className="h-4 w-4 mr-2" /> Grade My Content</>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="flex flex-col items-center gap-2 shrink-0">
                <ScoreRing score={result.overall} />
                <span className="text-sm text-muted-foreground">Overall AI Score</span>
              </div>
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {result.categories.map((cat) => (
                    <div key={cat.name} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1.5">
                          {cat.pass ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-red-500" />
                          )}
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

            {(result.topIssues.length > 0 || result.strengths.length > 0) && (
              <>
                <Separator className="my-4" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {result.strengths.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-2 text-green-700">Strengths</p>
                      <ul className="space-y-1">
                        {result.strengths.map((s, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {result.topIssues.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-2 text-red-700">Top Issues to Fix</p>
                      <ul className="space-y-1">
                        {result.topIssues.map((issue, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <AlertCircle className="h-3.5 w-3.5 text-yellow-500 shrink-0 mt-0.5" />
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
