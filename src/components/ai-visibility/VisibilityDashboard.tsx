import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Bot, Globe, Star, Zap } from "lucide-react";

const engines = [
  { name: "ChatGPT", score: 68, mentions: 29, trend: +11, color: "bg-green-500" },
  { name: "Claude", score: 82, mentions: 47, trend: +16, color: "bg-violet-500" },
  { name: "Perplexity", score: 57, mentions: 19, trend: +5, color: "bg-blue-500" },
  { name: "Gemini", score: 44, mentions: 12, trend: -1, color: "bg-yellow-500" },
];

const statCards = [
  { label: "AI Search Score", value: "68", unit: "/100", icon: Star, delta: "+11 this month", up: true },
  { label: "Total Mentions", value: "107", unit: "", icon: Bot, delta: "+32 this month", up: true },
  { label: "Inbound Leads", value: "6", unit: "", icon: Zap, delta: "+2 this month", up: true },
  { label: "Pages Indexed", value: "0", unit: "", icon: Globe, delta: "Launch F50SEO to grow", up: true },
];

const recentLeads = [
  { source: "ChatGPT", query: "best real estate agent in Jersey City NJ", time: "1h ago", status: "New" },
  { source: "Perplexity", query: "relocating from NYC to New Jersey 2026", time: "4h ago", status: "Contacted" },
  { source: "Claude", query: "how to sell my house fast in NJ", time: "1d ago", status: "Qualified" },
  { source: "Gemini", query: "first time homebuyer programs New Jersey", time: "2d ago", status: "New" },
];

export default function VisibilityDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <s.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-3xl font-bold">
                {s.value}
                <span className="text-base font-normal text-muted-foreground ml-1">{s.unit}</span>
              </div>
              <div className={`flex items-center gap-1 mt-1 text-xs ${s.up ? "text-green-600" : "text-red-500"}`}>
                {s.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {s.delta}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI Engine Visibility Scores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {engines.map((e) => (
              <div key={e.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${e.color}`} />
                    <span className="font-medium">{e.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span>{e.mentions} mentions</span>
                    <span className={`flex items-center gap-0.5 text-xs font-medium ${e.trend > 0 ? "text-green-600" : "text-red-500"}`}>
                      {e.trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {Math.abs(e.trend)}%
                    </span>
                    <span className="font-bold w-8 text-right text-foreground">{e.score}</span>
                  </div>
                </div>
                <Progress value={e.score} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent AI-Sourced Leads</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentLeads.map((lead, i) => (
              <div key={i} className="flex items-start justify-between gap-3 py-2 border-b last:border-0">
                <div className="space-y-0.5 flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">"{lead.query}"</p>
                  <p className="text-xs text-muted-foreground">via {lead.source} · {lead.time}</p>
                </div>
                <Badge variant={lead.status === "New" ? "default" : lead.status === "Qualified" ? "secondary" : "outline"} className="shrink-0 text-xs">
                  {lead.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
