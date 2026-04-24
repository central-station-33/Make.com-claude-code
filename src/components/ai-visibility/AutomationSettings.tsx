import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, Play, Globe, Webhook, Clock, Info, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type Settings = {
  id?: string;
  brand_name: string;
  target_topic: string;
  target_audience: string;
  wordpress_url: string;
  wordpress_username: string;
  wordpress_app_password: string;
  make_webhook_url: string;
  schedule_hour: number;
  auto_publish_blog: boolean;
  auto_publish_social: boolean;
  active: boolean;
};

const defaultSettings: Settings = {
  brand_name: "",
  target_topic: "",
  target_audience: "",
  wordpress_url: "",
  wordpress_username: "",
  wordpress_app_password: "",
  make_webhook_url: "",
  schedule_hour: 8,
  auto_publish_blog: false,
  auto_publish_social: false,
  active: false,
};

export default function AutomationSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [runningNow, setRunningNow] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("automation_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (data) setSettings(data as Settings);
      setLoading(false);
    };
    load();
  }, []);

  const set = (field: keyof Settings, value: unknown) =>
    setSettings(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const payload = { ...settings, user_id: user.id, updated_at: new Date().toISOString() };

      const { error } = settings.id
        ? await supabase.from("automation_settings").update(payload).eq("id", settings.id)
        : await supabase.from("automation_settings").insert(payload).select().single();

      if (error) throw error;
      toast({ title: "Settings saved", description: settings.active ? "Automation is active" : "Automation is paused" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({ title: "Save failed", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleRunNow = async () => {
    setRunningNow(true);
    try {
      const { error } = await supabase.functions.invoke("scheduled-content-runner", { body: {} });
      if (error) throw error;
      toast({ title: "Daily run triggered", description: "Content drafts will appear in the queue in ~2 minutes" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({ title: "Run failed", description: msg, variant: "destructive" });
    } finally {
      setRunningNow(false);
    }
  };

  const hours = Array.from({ length: 24 }, (_, i) => ({
    value: String(i),
    label: `${i === 0 ? "12" : i > 12 ? i - 12 : i}:00 ${i < 12 ? "AM" : "PM"}`,
  }));

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Status bar */}
      <Card className={settings.active ? "border-green-300 dark:border-green-800" : ""}>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`h-2.5 w-2.5 rounded-full ${settings.active ? "bg-green-500 animate-pulse" : "bg-muted-foreground"}`} />
              <span className="text-sm font-medium">
                {settings.active ? "Automation active — runs daily at " + hours[settings.schedule_hour]?.label : "Automation paused"}
              </span>
            </div>
            <Switch checked={settings.active} onCheckedChange={v => set("active", v)} />
          </div>
        </CardContent>
      </Card>

      {/* Brand config */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Brand Configuration</CardTitle>
          <CardDescription>The agent uses these to generate relevant daily content.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Brand Name</Label>
              <Input placeholder="Jet Realty Advisors" value={settings.brand_name} onChange={e => set("brand_name", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Topic / Niche</Label>
              <Input placeholder="Real estate advisory" value={settings.target_topic} onChange={e => set("target_topic", e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Target Audience</Label>
              <Input placeholder="Home buyers and sellers in Chicago" value={settings.target_audience} onChange={e => set("target_audience", e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" /> Daily Schedule</CardTitle>
          <CardDescription>
            Configure in Supabase Dashboard → Edge Functions → scheduled-content-runner → Cron as <code className="text-xs bg-muted px-1 rounded">0 {settings.schedule_hour} * * *</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Run time (your server timezone)</Label>
            <Select value={String(settings.schedule_hour)} onValueChange={v => set("schedule_hour", parseInt(v))}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                {hours.map(h => <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={handleRunNow} disabled={runningNow}>
            {runningNow ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Running...</> : <><Play className="h-4 w-4 mr-2" /> Run Now (manual trigger)</>}
          </Button>
        </CardContent>
      </Card>

      {/* WordPress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4" /> WordPress — jetreadvisors.com</CardTitle>
          <CardDescription>
            Create an Application Password in WP Admin → Users → Profile → Application Passwords.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>WordPress URL</Label>
            <Input placeholder="https://jetreadvisors.com" value={settings.wordpress_url} onChange={e => set("wordpress_url", e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Username</Label>
              <Input placeholder="admin" value={settings.wordpress_username} onChange={e => set("wordpress_username", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Application Password</Label>
              <Input type="password" placeholder="xxxx xxxx xxxx xxxx" value={settings.wordpress_app_password} onChange={e => set("wordpress_app_password", e.target.value)} />
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 py-1">
            <div>
              <p className="text-sm font-medium">Auto-publish blog posts</p>
              <p className="text-xs text-muted-foreground">Off = drafts go to review queue first</p>
            </div>
            <Switch checked={settings.auto_publish_blog} onCheckedChange={v => set("auto_publish_blog", v)} />
          </div>
        </CardContent>
      </Card>

      {/* Make.com */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Webhook className="h-4 w-4" /> Make.com — Social Distribution</CardTitle>
          <CardDescription>
            Create a Make.com scenario: Webhooks → Custom webhook → Router (by <code className="text-xs bg-muted px-1 rounded">platform</code> field) → LinkedIn / Twitter / Facebook / Instagram modules.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <p>IMPRINT sends one webhook per post with: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">platform</code>, <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">body</code>, <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">title</code>, <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">brand</code>, <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">tags</code>.</p>
              <p>In Make.com, use a Router with filter <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">platform = linkedin</code> etc. to route to each platform's module.</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Make.com Webhook URL</Label>
            <Input placeholder="https://hook.make.com/..." value={settings.make_webhook_url} onChange={e => set("make_webhook_url", e.target.value)} />
          </div>
          <div className="flex items-center justify-between gap-4 py-1">
            <div>
              <p className="text-sm font-medium">Auto-publish social posts</p>
              <p className="text-xs text-muted-foreground">Off = social drafts go to review queue first</p>
            </div>
            <Switch checked={settings.auto_publish_social} onCheckedChange={v => set("auto_publish_social", v)} />
          </div>

          {/* Platform checklist */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Platforms IMPRINT generates content for</p>
            <div className="grid grid-cols-2 gap-2">
              {["LinkedIn", "Twitter / X", "Facebook", "Instagram"].map(p => (
                <div key={p} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> {p}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : <><Save className="h-4 w-4 mr-2" /> Save Settings</>}
      </Button>
    </div>
  );
}
