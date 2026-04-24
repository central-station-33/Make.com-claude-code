import { AppSidebar } from "@/components/AppSidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, Search, Sparkles, FileText, Eye, Brain, Zap } from "lucide-react";
import VisibilityDashboard from "@/components/ai-visibility/VisibilityDashboard";
import AISearchGrader from "@/components/ai-visibility/AISearchGrader";
import ContentGenerator from "@/components/ai-visibility/ContentGenerator";
import LLMsTxtGenerator from "@/components/ai-visibility/LLMsTxtGenerator";
import SearchMonitor from "@/components/ai-visibility/SearchMonitor";
import IntentResearch from "@/components/ai-visibility/IntentResearch";
import LeadCaptureAgent from "@/components/ai-visibility/LeadCaptureAgent";

const tabs = [
  { value: "dashboard", label: "Overview", icon: LayoutDashboard },
  { value: "monitor", label: "Search Monitor", icon: Eye },
  { value: "intent", label: "Intent Research", icon: Brain },
  { value: "content", label: "Content Agent", icon: Sparkles },
  { value: "grader", label: "AI Grader", icon: Search },
  { value: "leads", label: "Lead Capture", icon: Zap },
  { value: "llmstxt", label: "LLMs.txt", icon: FileText },
];

export default function AIVisibility() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl p-8 animate-in fade-in duration-300">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded-lg bg-violet-600 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-3xl font-semibold tracking-tight">IMPRINT</h1>
            </div>
            <p className="text-muted-foreground">
              AI-powered visibility suite — monitor your brand across AI search engines, research intent, generate AI-optimized content, and score inbound leads with autonomous Claude agents.
            </p>
          </div>

          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="h-auto flex-wrap gap-1 bg-muted/50 p-1">
              {tabs.map(tab => (
                <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-1.5 text-sm">
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="dashboard"><VisibilityDashboard /></TabsContent>
            <TabsContent value="monitor"><SearchMonitor /></TabsContent>
            <TabsContent value="intent"><IntentResearch /></TabsContent>
            <TabsContent value="content"><ContentGenerator /></TabsContent>
            <TabsContent value="grader"><AISearchGrader /></TabsContent>
            <TabsContent value="leads"><LeadCaptureAgent /></TabsContent>
            <TabsContent value="llmstxt"><LLMsTxtGenerator /></TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
