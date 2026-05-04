import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CheckCircle2, XCircle, Globe, Linkedin, Twitter, Facebook, Instagram,
  RefreshCw, Loader2, Eye, Clock, Send, ChevronDown, ChevronUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type QueueItem = {
  id: string;
  created_at: string;
  scheduled_for: string;
  status: string;
  content_type: string;
  title: string | null;
  body: string;
  meta_description: string | null;
  tags: string[] | null;
  published_at: string | null;
  published_url: string | null;
  agent_run_id: string | null;
  brand: string | null;
  topic: string | null;
};

const platformIcon: Record<string, React.ReactNode> = {
  "blog-post":  <Globe className="h-3.5 w-3.5" />,
  linkedin:     <Linkedin className="h-3.5 w-3.5" />,
  twitter:      <Twitter className="h-3.5 w-3.5" />,
  facebook:     <Facebook className="h-3.5 w-3.5" />,
  instagram:    <Instagram className="h-3.5 w-3.5" />,
};

const platformColors: Record<string, string> = {
  "blog-post": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  linkedin:    "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
  twitter:     "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300",
  facebook:    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  instagram:   "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
};

const statusColors: Record<string, string> = {
  pending:   "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  approved:  "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  published: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  rejected:  "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

export default function ContentQueue() {
  const { toast } = useToast();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [publishing, setPublishing] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [editBody, setEditBody] = useState<Record<string, string>>({});

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("content_queue")
      .select("*")
      .order("scheduled_for", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50);

    if (filter !== "all") query = query.eq("status", filter);

    const { data, error } = await query;
    if (error) {
      toast({ title: "Failed to load queue", description: error.message, variant: "destructive" });
    } else {
      setItems((data ?? []) as QueueItem[]);
    }
    setLoading(false);
  }, [filter, toast]);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("content_queue").update({ status }).eq("id", id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return false;
    }
    setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i));
    return true;
  };

  const saveEdit = async (id: string) => {
    const body = editBody[id];
    if (!body) return;
    const { error } = await supabase.from("content_queue").update({ body }).eq("id", id);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      setItems(prev => prev.map(i => i.id === id ? { ...i, body } : i));
      setEditBody(prev => { const n = { ...prev }; delete n[id]; return n; });
      toast({ title: "Saved" });
    }
  };

  const handlePublish = async (item: QueueItem) => {
    setPublishing(prev => ({ ...prev, [item.id]: true }));
    try {
      // First approve it
      await updateStatus(item.id, "approved");

      const fn = item.content_type === "blog-post" ? "publish-blog-post" : "publish-social-posts";
      const { error } = await supabase.functions.invoke(fn, { body: { itemId: item.id } });
      if (error) throw error;

      await fetchQueue();
      toast({ title: "Published!", description: `${item.title} is live` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({ title: "Publish failed", description: msg, variant: "destructive" });
    } finally {
      setPublishing(prev => ({ ...prev, [item.id]: false }));
    }
  };

  const handleApproveAll = async () => {
    const pending = items.filter(i => i.status === "pending");
    for (const item of pending) {
      await updateStatus(item.id, "approved");
    }
    toast({ title: `${pending.length} items approved` });
    fetchQueue();
  };

  const pendingCount = items.filter(i => i.status === "pending").length;

  // Group by agent_run_id (daily batch)
  const grouped = items.reduce<Record<string, QueueItem[]>>((acc, item) => {
    const key = item.agent_run_id ?? "ungrouped";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle>Content Review Queue</CardTitle>
              <CardDescription>Review and approve AI-generated content before it goes live.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              {pendingCount > 1 && (
                <Button size="sm" variant="outline" onClick={handleApproveAll}>
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-green-600" /> Approve All ({pendingCount})
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={fetchQueue} disabled={loading}>
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
          <Clock className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground">No {filter === "all" ? "" : filter} items in queue.</p>
          <p className="text-xs text-muted-foreground">Run the daily automation or trigger it manually from Automation Settings.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([runId, runItems]) => (
          <div key={runId} className="space-y-3">
            <div className="flex items-center gap-2">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {runItems[0]?.scheduled_for ?? "Unknown date"} · {runItems[0]?.brand ?? ""}
                {runId !== "ungrouped" && <span className="ml-1 font-mono opacity-50">#{runId.slice(0, 8)}</span>}
              </span>
              <Separator className="flex-1" />
            </div>

            {runItems.map(item => {
              const isExpanded = expanded[item.id] ?? false;
              const isEditing = item.id in editBody;
              const body = editBody[item.id] ?? item.body;

              return (
                <Card key={item.id} className={item.status === "rejected" ? "opacity-60" : ""}>
                  <CardContent className="pt-4 space-y-3">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className={`text-xs flex items-center gap-1 ${platformColors[item.content_type] ?? ""}`}>
                          {platformIcon[item.content_type]}
                          {item.content_type === "blog-post" ? "Blog Post" : item.content_type.charAt(0).toUpperCase() + item.content_type.slice(1)}
                        </Badge>
                        <Badge variant="secondary" className={`text-xs ${statusColors[item.status] ?? ""}`}>
                          {item.status}
                        </Badge>
                        {item.published_url && item.published_url !== "make.com/webhook/delivered" && (
                          <a href={item.published_url} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                            <Eye className="h-3 w-3" /> View live
                          </a>
                        )}
                      </div>
                      <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-muted-foreground"
                        onClick={() => setExpanded(prev => ({ ...prev, [item.id]: !isExpanded }))}>
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </Button>
                    </div>

                    <p className="text-sm font-semibold leading-snug">{item.title}</p>

                    {isExpanded && (
                      <div className="space-y-2">
                        <Textarea
                          value={body}
                          onChange={e => setEditBody(prev => ({ ...prev, [item.id]: e.target.value }))}
                          rows={item.content_type === "blog-post" ? 20 : 6}
                          className="text-sm font-mono resize-none"
                        />
                        {isEditing && (
                          <Button size="sm" variant="outline" onClick={() => saveEdit(item.id)}>Save edits</Button>
                        )}
                        {item.meta_description && (
                          <p className="text-xs text-muted-foreground italic">Meta: {item.meta_description}</p>
                        )}
                        {item.tags?.length ? (
                          <div className="flex flex-wrap gap-1">
                            {item.tags.map((t, i) => <Badge key={i} variant="outline" className="text-xs">{t}</Badge>)}
                          </div>
                        ) : null}
                      </div>
                    )}

                    {/* Action row */}
                    {item.status === "pending" && (
                      <div className="flex gap-2 pt-1">
                        <Button size="sm" className="flex-1" onClick={() => handlePublish(item)} disabled={publishing[item.id]}>
                          {publishing[item.id]
                            ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Publishing...</>
                            : <><Send className="h-3.5 w-3.5 mr-1.5" /> Approve & Publish</>}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => updateStatus(item.id, "approved")}>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-green-600" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => updateStatus(item.id, "rejected")}>
                          <XCircle className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </div>
                    )}
                    {item.status === "approved" && (
                      <Button size="sm" className="w-full" onClick={() => handlePublish(item)} disabled={publishing[item.id]}>
                        {publishing[item.id]
                          ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Publishing...</>
                          : <><Send className="h-3.5 w-3.5 mr-1.5" /> Publish Now</>}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
}
