import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Globe, Linkedin, Twitter, Facebook, Instagram, CheckCircle2, Clock, TrendingUp, Calendar, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type QueueItem = {
  id: string;
  scheduled_for: string;
  status: string;
  content_type: string;
  title: string | null;
  published_at: string | null;
  published_url: string | null;
  brand: string | null;
  topic: string | null;
};

const platformIcon: Record<string, React.ReactNode> = {
  "blog-post": <Globe className="h-3.5 w-3.5" />,
  linkedin:    <Linkedin className="h-3.5 w-3.5" />,
  twitter:     <Twitter className="h-3.5 w-3.5" />,
  facebook:    <Facebook className="h-3.5 w-3.5" />,
  instagram:   <Instagram className="h-3.5 w-3.5" />,
};

const platformColors: Record<string, string> = {
  "blog-post": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  linkedin:    "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
  twitter:     "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300",
  facebook:    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  instagram:   "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
};

export default function AutomationDashboard() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("content_queue")
        .select("id,scheduled_for,status,content_type,title,published_at,published_url,brand,topic")
        .order("created_at", { ascending: false })
        .limit(100);
      setItems((data ?? []) as QueueItem[]);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  const published = items.filter(i => i.status === "published");
  const pending   = items.filter(i => i.status === "pending");
  const approved  = items.filter(i => i.status === "approved");
  const blogPublished = published.filter(i => i.content_type === "blog-post");
  const socialPublished = published.filter(i => i.content_type !== "blog-post");

  const statCards = [
    { label: "Total Published", value: published.length, icon: CheckCircle2, color: "text-green-600" },
    { label: "Blog Posts Live", value: blogPublished.length, icon: Globe, color: "text-blue-600" },
    { label: "Social Posts Sent", value: socialPublished.length, icon: TrendingUp, color: "text-violet-600" },
    { label: "Awaiting Review", value: pending.length + approved.length, icon: Clock, color: "text-yellow-600" },
  ];

  // Group published by date
  const byDate = published.reduce<Record<string, QueueItem[]>>((acc, item) => {
    const d = item.scheduled_for ?? item.published_at?.split("T")[0] ?? "Unknown";
    if (!acc[d]) acc[d] = [];
    acc[d].push(item);
    return acc;
  }, {});

  const sortedDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(s => (
          <Card key={s.label}>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Platform breakdown */}
      {published.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Published by Platform</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {["blog-post", "linkedin", "twitter", "facebook", "instagram"].map(platform => {
                const count = published.filter(i => i.content_type === platform).length;
                return (
                  <div key={platform} className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/40 text-center">
                    <div className={`flex items-center gap-1.5 ${platformColors[platform]} rounded-full px-2 py-0.5 text-xs font-medium`}>
                      {platformIcon[platform]}
                      <span className="capitalize">{platform === "blog-post" ? "Blog" : platform}</span>
                    </div>
                    <span className="text-2xl font-bold">{count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent publish history */}
      {sortedDates.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Publish History
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {sortedDates.slice(0, 14).map(date => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-muted-foreground">{new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</span>
                  <Separator className="flex-1" />
                  <Badge variant="outline" className="text-xs">{byDate[date].length} posts</Badge>
                </div>
                <div className="space-y-1.5">
                  {byDate[date].map(item => (
                    <div key={item.id} className="flex items-center gap-2 text-sm">
                      <Badge variant="secondary" className={`text-xs flex items-center gap-1 shrink-0 ${platformColors[item.content_type] ?? ""}`}>
                        {platformIcon[item.content_type]}
                        <span className="capitalize">{item.content_type === "blog-post" ? "Blog" : item.content_type}</span>
                      </Badge>
                      <span className="truncate text-muted-foreground flex-1">{item.title}</span>
                      {item.published_url && item.published_url !== "make.com/webhook/delivered" && (
                        <a href={item.published_url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline shrink-0">View</a>
                      )}
                      {item.published_url === "make.com/webhook/delivered" && (
                        <span className="text-xs text-green-600 shrink-0 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Sent
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
          <Calendar className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">No published content yet.</p>
          <p className="text-xs text-muted-foreground">Configure Automation Settings and run your first daily batch.</p>
        </div>
      )}
    </div>
  );
}
