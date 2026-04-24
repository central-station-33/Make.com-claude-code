import { AppSidebar } from "@/components/AppSidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, Search, Sparkles, FileText, Eye } from "lucide-react";
import VisibilityDashboard from "@/components/ai-visibility/VisibilityDashboard";
import AISearchGrader from "@/components/ai-visibility/AISearchGrader";
import ContentGenerator from "@/components/ai-visibility/ContentGenerator";
import LLMsTxtGenerator from "@/components/ai-visibility/LLMsTxtGenerator";
import SearchMonitor from "@/components/ai-visibility/SearchMonitor";

const tabs = [
  { value: "dashboard", label: "Overview", icon: LayoutDashboard },
  { value: "grader", label: "AI Search Grader", icon: Search },
  { value: "content", label: "Content Generator", icon: Sparkles },
  { value: "llmstxt", label: "LLMs.txt", icon: FileText },
  { value: "monitor", label: "Search Monitor", icon: Eye },
];

export default function AIVisibility() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl p-8 animate-in fade-in duration-300">
          <div className="mb-6">
            <h1 className="text-3xl font-semibold tracking-tight">AI Visibility Suite</h1>
            <p className="text-muted-foreground mt-2">
              Monitor your brand across AI search engines, generate AI-optimized content, and capture high-intent leads from ChatGPT, Claude, Perplexity, and Gemini.
            </p>
          </div>

          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="h-auto flex-wrap gap-1 bg-muted/50 p-1">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex items-center gap-1.5 text-sm"
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="dashboard">
              <VisibilityDashboard />
            </TabsContent>

            <TabsContent value="grader">
              <AISearchGrader />
            </TabsContent>

            <TabsContent value="content">
              <ContentGenerator />
            </TabsContent>

            <TabsContent value="llmstxt">
              <LLMsTxtGenerator />
            </TabsContent>

            <TabsContent value="monitor">
              <SearchMonitor />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
