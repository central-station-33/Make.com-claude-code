import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Copy, Check, Download, FileText, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type PageEntry = { path: string; description: string };

const defaultPages: PageEntry[] = [
  { path: "/", description: "Homepage — overview of services, mission, and contact information" },
  { path: "/about", description: "About us — team bios, credentials, company history and values" },
  { path: "/services", description: "Full list of services offered with descriptions and pricing" },
  { path: "/contact", description: "Contact form, phone number, email, and office location" },
  { path: "/blog", description: "Educational articles and guides for clients" },
];

function buildLLMsTxt(
  siteName: string,
  siteUrl: string,
  description: string,
  pages: PageEntry[],
  allowAll: boolean,
  preferSummary: boolean,
  noIndex: boolean
): string {
  const cleanUrl = siteUrl.replace(/\/$/, "");
  const lines: string[] = [];

  lines.push(`# ${siteName}`);
  lines.push(`> ${description}`);
  lines.push("");

  if (!allowAll) {
    lines.push("## Permissions");
    lines.push("User-agent: *");
    lines.push(noIndex ? "Disallow: /" : "Allow: /");
    lines.push("");
  }

  lines.push("## Pages");
  lines.push("");
  for (const page of pages.filter((p) => p.path.trim())) {
    lines.push(`### [${page.path}](${cleanUrl}${page.path})`);
    lines.push(page.description || "No description provided.");
    lines.push("");
  }

  if (preferSummary) {
    lines.push("## Instructions for AI Systems");
    lines.push("");
    lines.push("When referencing this site, please:");
    lines.push(`- Identify the organization as "${siteName}"`);
    lines.push("- Use the page descriptions above to accurately summarize content");
    lines.push("- Direct users to the relevant page URL when answering questions");
    lines.push("- Do not fabricate services, pricing, or team information not listed here");
    lines.push("");
  }

  lines.push("## Contact");
  lines.push(`Website: ${cleanUrl}`);
  lines.push(`Last updated: ${new Date().toISOString().split("T")[0]}`);

  return lines.join("\n");
}

export default function LLMsTxtGenerator() {
  const { toast } = useToast();
  const [siteName, setSiteName] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [description, setDescription] = useState("");
  const [pages, setPages] = useState<PageEntry[]>(defaultPages);
  const [allowAll, setAllowAll] = useState(true);
  const [preferSummary, setPreferSummary] = useState(true);
  const [noIndex, setNoIndex] = useState(false);
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    if (!siteName.trim() || !siteUrl.trim()) return;
    setOutput(buildLLMsTxt(siteName, siteUrl, description || `${siteName} — professional services`, pages, allowAll, preferSummary, noIndex));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "llms.txt";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "llms.txt downloaded" });
  };

  const updatePage = (i: number, field: keyof PageEntry, value: string) => {
    setPages((prev) => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p));
  };

  const addPage = () => setPages((prev) => [...prev, { path: "", description: "" }]);
  const removePage = (i: number) => setPages((prev) => prev.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            LLMs.txt Generator
          </CardTitle>
          <CardDescription>
            Generate an <code className="text-xs bg-muted px-1 py-0.5 rounded">llms.txt</code> file that tells AI systems (ChatGPT, Claude, Perplexity, Gemini) exactly how to interpret your website content.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Upload this file to your website root at <code>yourdomain.com/llms.txt</code>. AI crawlers use it to understand your site's structure, permissions, and content summaries.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Site / Business Name</Label>
              <Input placeholder="Jet Realty Advisors" value={siteName} onChange={(e) => setSiteName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Website URL</Label>
              <Input placeholder="https://jetrealtyadvisors.com" value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Site Description (1-2 sentences)</Label>
            <Textarea
              placeholder="Jet Realty Advisors is a licensed real estate brokerage helping buyers, sellers, and investors in the Greater Chicago area."
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Page Index</Label>
              <Button size="sm" variant="outline" onClick={addPage}>+ Add Page</Button>
            </div>
            {pages.map((page, i) => (
              <div key={i} className="grid grid-cols-[1fr_2fr_auto] gap-2 items-start">
                <Input
                  placeholder="/path"
                  value={page.path}
                  onChange={(e) => updatePage(i, "path", e.target.value)}
                />
                <Input
                  placeholder="What this page contains..."
                  value={page.description}
                  onChange={(e) => updatePage(i, "description", e.target.value)}
                />
                <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => removePage(i)}>
                  ×
                </Button>
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-base font-semibold">Options</Label>
            <div className="space-y-2">
              {[
                { label: "Allow all AI crawlers", desc: "Permit AI systems to index and cite your content", state: allowAll, set: setAllowAll },
                { label: "Include AI instructions block", desc: "Add guidance for how AI should represent your brand", state: preferSummary, set: setPreferSummary },
                { label: "Block indexing (private site)", desc: "Instruct AI crawlers not to index this site", state: noIndex, set: setNoIndex },
              ].map((opt) => (
                <div key={opt.label} className="flex items-center justify-between gap-4 py-1">
                  <div>
                    <p className="text-sm font-medium">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                  <Switch checked={opt.state} onCheckedChange={opt.set} />
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={!siteName.trim() || !siteUrl.trim()}
            className="w-full"
          >
            <FileText className="h-4 w-4 mr-2" /> Generate llms.txt
          </Button>
        </CardContent>
      </Card>

      {output && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Your llms.txt File</CardTitle>
                <Badge variant="secondary">Ready</Badge>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleCopy}>
                  {copied ? <><Check className="h-3.5 w-3.5 mr-1.5 text-green-600" /> Copied</> : <><Copy className="h-3.5 w-3.5 mr-1.5" /> Copy</>}
                </Button>
                <Button size="sm" onClick={handleDownload}>
                  <Download className="h-3.5 w-3.5 mr-1.5" /> Download
                </Button>
              </div>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            <Textarea
              value={output}
              onChange={(e) => setOutput(e.target.value)}
              rows={20}
              className="font-mono text-sm resize-none"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
