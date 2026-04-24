import { AppSidebar } from "@/components/AppSidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LayoutDashboard, Search, Sparkles, FileText, Eye, Brain,
  Zap, CalendarClock, ListChecks, Settings2, Map
} from "lucide-react";
import VisibilityDashboard from "@/components/ai-visibility/VisibilityDashboard";
import AISearchGrader from "@/components/ai-visibility/AISearchGrader";
import ContentGenerator from "@/components/ai-visibility/ContentGenerator";
import LLMsTxtGenerator from "@/components/ai-visibility/LLMsTxtGenerator";
import SearchMonitor from "@/components/ai-visibility/SearchMonitor";
import IntentResearch from "@/components/ai-visibility/IntentResearch";
import LeadCaptureAgent from "@/components/ai-visibility/LeadCaptureAgent";
import AutomationDashboard from "@/components/ai-visibility/AutomationDashboard";
import ContentQueue from "@/components/ai-visibility/ContentQueue";
import AutomationSettings from "@/components/ai-visibility/AutomationSettings";
import ContentPlan from "@/components/ai-visibility/ContentPlan";

const tabs = [
  { value: "plan",       label: "Content Plan",     icon: Map },
  { value: "dashboard",  label: "Overview",         icon: LayoutDashboard },
  { value: "monitor",    label: "Search Monitor",   icon: Eye },
  { value: "intent",     label: "Intent Research",  icon: Brain },
  { value: "content",    label: "Content Agent",    icon: Sparkles },
  { value: "grader",     label: "AI Grader",        icon: Search },
  { value: "leads",      label: "Lead Capture",     icon: Zap },
  { value: "llmstxt",   label: "LLMs.txt",          icon: FileText },
  { value: "auto-dash",  label: "Automation",       icon: CalendarClock },
  { value: "queue",      label: "Review Queue",     icon: ListChecks },
  { value: "auto-cfg",   label: "Settings",         icon: Settings2 },
];

export default function AIVisibility() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl p-8 animate-in fade-in duration-300">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-9 w-9 rounded-lg bg-black dark:bg-white flex items-center justify-center">
                <span className="text-white dark:text-black text-xs font-black tracking-tighter">F50</span>
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight">F50SEO</h1>
                <p className="text-xs text-muted-foreground font-medium tracking-widest uppercase">JET Realty Advisors · AI Search Engine</p>
              </div>
            </div>
            <p className="text-muted-foreground mt-2">
              Fortune 50-caliber AI search dominance for NY/NJ real estate — autonomous content generation, AEO/GEO optimization, and daily publishing to jetrealtyadvisors.com and all social platforms.
            </p>
          </div>

          <Tabs defaultValue="plan" className="space-y-6">
            <TabsList className="h-auto flex-wrap gap-1 bg-muted/50 p-1">
              {tabs.map(tab => (
                <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-1.5 text-sm">
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="plan">       <ContentPlan />           </TabsContent>
            <TabsContent value="dashboard">  <VisibilityDashboard />   </TabsContent>
            <TabsContent value="monitor">    <SearchMonitor />         </TabsContent>
            <TabsContent value="intent">     <IntentResearch />        </TabsContent>
            <TabsContent value="content">    <ContentGenerator />      </TabsContent>
            <TabsContent value="grader">     <AISearchGrader />        </TabsContent>
            <TabsContent value="leads">      <LeadCaptureAgent />      </TabsContent>
            <TabsContent value="llmstxt">    <LLMsTxtGenerator />      </TabsContent>
            <TabsContent value="auto-dash">  <AutomationDashboard />   </TabsContent>
            <TabsContent value="queue">      <ContentQueue />          </TabsContent>
            <TabsContent value="auto-cfg">   <AutomationSettings />    </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
