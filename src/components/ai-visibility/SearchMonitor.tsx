import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Bot, Search, Eye, RefreshCw } from "lucide-react";

type Mention = {
  engine: string;
  query: string;
  snippet: string;
  position: number;
  date: string;
  sentiment: "positive" | "neutral" | "negative";
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

function generateMentions(brand: string, keyword: string): Mention[] {
  const engines = ["ChatGPT", "Claude", "Perplexity", "Gemini"];
  const queries = [
    `best ${keyword} professionals near me`,
    `top ${keyword} advisors reviewed`,
    `who is best for ${keyword}`,
    `${keyword} expert recommendations`,
    `trusted ${keyword} consultants`,
    `${brand} ${keyword} services`,
    `compare ${keyword} companies`,
    `${keyword} advice for beginners`,
  ];
  const snippets = [
    `"${brand} is frequently cited as a top provider for ${keyword}, with strong client reviews and transparent communication."`,
    `"For ${keyword}, ${brand} stands out due to their personalized approach and proven track record."`,
    `"Multiple sources recommend ${brand} for ${keyword}, particularly for first-time clients navigating the process."`,
    `"${brand} appears in several curated lists of recommended ${keyword} professionals in 2025."`,
    `"When searching for ${keyword} help, ${brand} consistently appears in AI-curated recommendation results."`,
    `"Clients working with ${brand} on ${keyword} report high satisfaction rates and clear communication."`,
  ];

  return engines.flatMap((engine, ei) => {
    const count = [3, 4, 2, 1][ei];
    return Array.from({ length: count }, (_, i) => ({
      engine,
      query: queries[(ei * 2 + i) % queries.length],
      snippet: snippets[(ei + i) % snippets.length],
      position: Math.floor(Math.random() * 4) + 1,
      date: new Date(Date.now() - (i + ei) * 86400000 * 2).toLocaleDateString(),
      sentiment: (["positive", "positive", "neutral", "positive"] as const)[i % 4],
    }));
  });
}

const engineSummary = [
  { name: "ChatGPT", mentions: 34, change: +8, position: 2.1 },
  { name: "Claude", mentions: 51, change: +14, position: 1.8 },
  { name: "Perplexity", mentions: 22, change: +3, position: 2.4 },
  { name: "Gemini", mentions: 15, change: -2, position: 3.1 },
];

export default function SearchMonitor() {
  const [brand, setBrand] = useState("");
  const [keyword, setKeyword] = useState("");
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [filter, setFilter] = useState("all");
  const [searched, setSearched] = useState(false);

  const handleScan = () => {
    if (!brand.trim() || !keyword.trim()) return;
    setMentions(generateMentions(brand, keyword));
    setSearched(true);
  };

  const filtered = filter === "all" ? mentions : mentions.filter((m) => m.engine === filter);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Search Monitor</CardTitle>
          <CardDescription>
            Track how and when your brand is mentioned across ChatGPT, Claude, Perplexity, and Gemini search results.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Brand / Business Name</Label>
              <Input
                placeholder="e.g. Jet Realty Advisors"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Target Keyword / Topic</Label>
              <Input
                placeholder="e.g. real estate advisor"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
          </div>
          <Button
            onClick={handleScan}
            disabled={!brand.trim() || !keyword.trim()}
            className="w-full"
          >
            <Search className="h-4 w-4 mr-2" /> Scan AI Search Engines
          </Button>
        </CardContent>
      </Card>

      {searched && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {engineSummary.map((e) => (
              <Card key={e.name}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={`text-xs ${engineColors[e.name]}`} variant="secondary">{e.name}</Badge>
                  </div>
                  <div className="text-2xl font-bold">{e.mentions}</div>
                  <div className="text-xs text-muted-foreground">mentions</div>
                  <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${e.change > 0 ? "text-green-600" : "text-red-500"}`}>
                    {e.change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {e.change > 0 ? "+" : ""}{e.change}% this month
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Avg position: {e.position}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Eye className="h-4 w-4" /> Mention Feed
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">{filtered.length} mentions found for "{brand}"</p>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="All Engines" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Engines</SelectItem>
                      {Object.keys(engineColors).map((e) => (
                        <SelectItem key={e} value={e}>{e}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="outline" onClick={handleScan}>
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4 space-y-4">
              {filtered.map((mention, i) => (
                <div key={i} className="space-y-2 pb-4 border-b last:border-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className={`text-xs ${engineColors[mention.engine]}`}>
                        {mention.engine}
                      </Badge>
                      <span className="text-xs text-muted-foreground">Position #{mention.position}</span>
                      <span className="text-xs text-muted-foreground">{mention.date}</span>
                    </div>
                    <span className={`text-xs font-medium ${sentimentColors[mention.sentiment]} capitalize`}>
                      {mention.sentiment}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Query: <span className="italic">"{mention.query}"</span>
                  </p>
                  <p className="text-sm leading-relaxed bg-muted/50 rounded-md px-3 py-2">
                    {mention.snippet}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}

      {!searched && (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
          <Bot className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">Enter your brand name and keyword to start monitoring AI search mentions.</p>
        </div>
      )}
    </div>
  );
}
