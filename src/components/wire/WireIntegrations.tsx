import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Copy,
  Check,
  Github,
  RefreshCw,
  Plus,
  Trash2,
  ExternalLink,
  Wifi,
  Key,
  AlertCircle,
} from 'lucide-react';
import { auth } from '@/integrations/firebase/config';
import {
  getDocuments,
  createDocument,
  deleteDocument,
  COLLECTIONS,
} from '@/integrations/firebase/firestore';
import { signInWithGitHub } from '@/integrations/firebase/authHelpers';

// Update WIRE_API_BASE once you deploy a Firebase Cloud Function or
// standalone API that replaces the Supabase edge function.
const WIRE_API_BASE = import.meta.env.VITE_WIRE_API_BASE ?? 'https://YOUR_FIREBASE_REGION-YOUR_PROJECT.cloudfunctions.net/wireApi';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={copy}>
      {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <div className="relative">
      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs overflow-x-auto font-mono leading-relaxed">
        {children}
      </pre>
      <div className="absolute top-2 right-2">
        <CopyButton text={children} />
      </div>
    </div>
  );
}

function EndpointRow({ method, path, desc }: { method: string; path: string; desc: string }) {
  const methodColors: Record<string, string> = {
    GET: 'bg-green-100 text-green-700',
    POST: 'bg-blue-100 text-blue-700',
    PATCH: 'bg-yellow-100 text-yellow-700',
    DELETE: 'bg-red-100 text-red-700',
  };
  return (
    <div className="flex items-start gap-3 py-2 border-b last:border-0 text-sm">
      <span className={`text-xs font-bold px-2 py-0.5 rounded shrink-0 ${methodColors[method] ?? 'bg-gray-100 text-gray-700'}`}>
        {method}
      </span>
      <code className="font-mono text-xs text-gray-800 shrink-0">{path}</code>
      <span className="text-muted-foreground text-xs">{desc}</span>
    </div>
  );
}

export function WireIntegrations() {
  const [githubUser, setGithubUser] = useState<{ login: string; avatar_url: string } | null>(null);
  const [githubLoading, setGithubLoading] = useState(false);
  const [apiKeys, setApiKeys] = useState<{ id: string; name: string; key: string; created_at: string }[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle');
  const [activeApiKey, setActiveApiKey] = useState('');

  useEffect(() => {
    // Check if current Firebase user signed in with GitHub
    const currentUser = auth.currentUser;
    if (currentUser) {
      const ghData = currentUser.providerData.find((p) => p.providerId === 'github.com');
      if (ghData) {
        setGithubUser({
          login: ghData.displayName ?? ghData.email ?? '',
          avatar_url: ghData.photoURL ?? '',
        });
      }
    }
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    const keys = await getDocuments<{ name: string; key: string; created_at: string }>(
      COLLECTIONS.WIRE_API_KEYS
    );
    setApiKeys(keys as typeof apiKeys);
  };

  const handleGitHubConnect = async () => {
    setGithubLoading(true);
    try {
      await signInWithGitHub();
    } finally {
      setGithubLoading(false);
    }
  };

  const handleGitHubDisconnect = async () => {
    setGithubUser(null);
  };

  const generateKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return 'wire_' + Array.from({ length: 40 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;
    const key = generateKey();
    const id = await createDocument(COLLECTIONS.WIRE_API_KEYS, {
      name: newKeyName.trim(),
      key,
    });
    const newEntry = { id, name: newKeyName.trim(), key, created_at: new Date().toISOString() };
    setApiKeys((prev) => [newEntry, ...prev]);
    setGeneratedKey(key);
    setNewKeyName('');
  };

  const handleDeleteKey = async (id: string) => {
    await deleteDocument(COLLECTIONS.WIRE_API_KEYS, id);
    setApiKeys((prev) => prev.filter((k) => k.id !== id));
  };

  const handleTestConnection = async () => {
    if (!activeApiKey) return;
    setTestStatus('testing');
    try {
      const res = await fetch(`${WIRE_API_BASE}/stats`, {
        headers: { 'X-Wire-Api-Key': activeApiKey },
      });
      setTestStatus(res.ok ? 'ok' : 'error');
    } catch {
      setTestStatus('error');
    }
  };

  const retoolResourceConfig = JSON.stringify(
    {
      type: 'restapi',
      name: 'The Wire API',
      options: {
        baseURL: WIRE_API_BASE,
        headers: [{ key: 'X-Wire-Api-Key', value: '{{wireApiKey}}' }],
      },
    },
    null,
    2
  );

  const sampleQueries = {
    contacts: `GET ${WIRE_API_BASE}/contacts?limit=50&search={{searchInput}}`,
    stats: `GET ${WIRE_API_BASE}/stats`,
    opportunities: `GET ${WIRE_API_BASE}/opportunities?status=open`,
    appointments: `GET ${WIRE_API_BASE}/appointments?from={{startDate}}&to={{endDate}}`,
    sendMessage: `POST ${WIRE_API_BASE}/conversations/{{convId}}/messages\nBody: { "body": "{{messageText}}", "channel": "sms" }`,
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Integrations</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Connect The Wire to GitHub and Retool for your agent workspace.
        </p>
      </div>

      {/* GitHub Integration */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            <CardTitle className="text-base">GitHub</CardTitle>
            {githubUser && <Badge className="bg-green-100 text-green-700 border-0">Connected</Badge>}
          </div>
          <CardDescription>
            Sign in with GitHub so your team can access The Wire using their GitHub credentials.
            GitHub OAuth must be enabled in your Supabase project's Auth settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {githubUser ? (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border">
              {githubUser.avatar_url && (
                <img src={githubUser.avatar_url} alt="" className="h-8 w-8 rounded-full" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium">@{githubUser.login}</p>
                <p className="text-xs text-muted-foreground">GitHub account connected</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleGitHubDisconnect}>
                Disconnect
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleGitHubConnect}
              disabled={githubLoading}
            >
              <Github className="h-4 w-4" />
              Connect GitHub Account
            </Button>
          )}

          <div className="rounded-lg border bg-blue-50 p-4 space-y-2">
            <p className="text-xs font-semibold text-blue-800 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" /> Setup required in Supabase
            </p>
            <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
              <li>Go to your Supabase Dashboard → Authentication → Providers</li>
              <li>Enable the GitHub provider</li>
              <li>
                Create a GitHub OAuth App at{' '}
                <a href="https://github.com/settings/developers" target="_blank" rel="noreferrer" className="underline">
                  github.com/settings/developers
                </a>
              </li>
              <li>
                Set the callback URL to:{' '}
                <code className="bg-blue-100 px-1 rounded">{SUPABASE_URL}/auth/v1/callback</code>
              </li>
              <li>Paste the Client ID and Secret into Supabase</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Retool API */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            <CardTitle className="text-base">Retool API</CardTitle>
            <Badge variant="outline" className="border-green-400 text-green-700">Active</Badge>
          </div>
          <CardDescription>
            The Wire exposes a REST API that Retool can connect to as a Resource. Use the endpoint and
            an API key below to build Retool apps on top of your Wire data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Base URL */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Base URL</p>
            <div className="flex items-center gap-2 bg-gray-50 border rounded-lg px-3 py-2">
              <code className="text-sm font-mono flex-1 break-all">{WIRE_API_BASE}</code>
              <CopyButton text={WIRE_API_BASE} />
            </div>
          </div>

          {/* API Keys */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Key className="h-3.5 w-3.5" /> API Keys
            </p>

            {generatedKey && (
              <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-3 space-y-2">
                <p className="text-xs font-semibold text-yellow-800">
                  Copy this key now — it won't be shown again.
                </p>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono bg-yellow-100 rounded px-2 py-1 flex-1 break-all">
                    {generatedKey}
                  </code>
                  <CopyButton text={generatedKey} />
                </div>
                <Button size="sm" variant="outline" onClick={() => setGeneratedKey(null)}>
                  Done
                </Button>
              </div>
            )}

            <div className="space-y-2">
              {apiKeys.map((k) => (
                <div key={k.id} className="flex items-center gap-3 p-2.5 rounded-lg border bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{k.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      wire_••••••••{k.key.slice(-6)}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground shrink-0">
                    {new Date(k.created_at).toLocaleDateString()}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteKey(k.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              {apiKeys.length === 0 && !generatedKey && (
                <p className="text-sm text-muted-foreground">No API keys yet.</p>
              )}
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Key name (e.g. Retool Production)"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="h-8 text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateKey()}
              />
              <Button size="sm" onClick={handleCreateKey} disabled={!newKeyName.trim()} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Generate Key
              </Button>
            </div>
          </div>

          {/* Test Connection */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Test Connection</p>
            <div className="flex gap-2">
              <Input
                placeholder="Paste an API key to test..."
                value={activeApiKey}
                onChange={(e) => setActiveApiKey(e.target.value)}
                className="h-8 text-sm font-mono"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleTestConnection}
                disabled={!activeApiKey || testStatus === 'testing'}
                className="gap-1.5"
              >
                {testStatus === 'testing' ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                Test
              </Button>
            </div>
            {testStatus === 'ok' && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <Check className="h-3.5 w-3.5" /> Connected successfully
              </p>
            )}
            {testStatus === 'error' && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" /> Connection failed — check the key and CORS settings
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Retool Setup Guide */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            Connecting Retool
          </CardTitle>
          <CardDescription>
            Step-by-step guide to wire The Wire into your Retool workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <ol className="space-y-4 text-sm">
            <li className="space-y-2">
              <p className="font-medium">1. Add a REST API Resource in Retool</p>
              <p className="text-muted-foreground text-xs">
                In Retool → Resources → Create New → REST API. Use the config below:
              </p>
              <CodeBlock>{retoolResourceConfig}</CodeBlock>
            </li>

            <li className="space-y-2">
              <p className="font-medium">2. Set your API Key as a Retool Secret</p>
              <p className="text-muted-foreground text-xs">
                In Retool → Settings → Secrets, add <code className="bg-gray-100 px-1 rounded">wireApiKey</code> with the key you generated above.
              </p>
            </li>

            <li className="space-y-2">
              <p className="font-medium">3. Use these sample queries in your Retool app</p>
              <div className="space-y-3">
                {Object.entries(sampleQueries).map(([name, query]) => (
                  <div key={name} className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground capitalize">{name}</p>
                    <CodeBlock>{query}</CodeBlock>
                  </div>
                ))}
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* API Reference */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">API Reference</CardTitle>
          <CardDescription>
            All endpoints accept <code className="bg-gray-100 px-1 rounded text-xs">X-Wire-Api-Key</code> header for auth.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { group: 'Contacts', rows: [
              { method: 'GET', path: '/contacts', desc: 'List contacts (search, tag, limit, offset)' },
              { method: 'GET', path: '/contacts/:id', desc: 'Get single contact' },
              { method: 'POST', path: '/contacts', desc: 'Create contact' },
              { method: 'PATCH', path: '/contacts/:id', desc: 'Update contact' },
              { method: 'DELETE', path: '/contacts/:id', desc: 'Delete contact' },
            ]},
            { group: 'Conversations & Messages', rows: [
              { method: 'GET', path: '/conversations', desc: 'List conversations (status, channel, limit)' },
              { method: 'GET', path: '/conversations/:id/messages', desc: 'Get messages in a conversation' },
              { method: 'POST', path: '/conversations/:id/messages', desc: 'Send a message' },
            ]},
            { group: 'Pipeline', rows: [
              { method: 'GET', path: '/opportunities', desc: 'List opportunities (status, pipeline_id, stage_id)' },
              { method: 'POST', path: '/opportunities', desc: 'Create opportunity' },
              { method: 'PATCH', path: '/opportunities/:id', desc: 'Move stage / update deal' },
            ]},
            { group: 'Appointments', rows: [
              { method: 'GET', path: '/appointments', desc: 'List appointments (status, from, to)' },
              { method: 'POST', path: '/appointments', desc: 'Create appointment' },
              { method: 'PATCH', path: '/appointments/:id', desc: 'Update appointment status' },
            ]},
            { group: 'Read-only', rows: [
              { method: 'GET', path: '/automations', desc: 'List automations' },
              { method: 'GET', path: '/campaigns', desc: 'List campaigns' },
              { method: 'GET', path: '/stats', desc: 'Dashboard stats roll-up' },
            ]},
          ].map(({ group, rows }) => (
            <div key={group}>
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">{group}</p>
              <div className="rounded-lg border overflow-hidden">
                <div className="px-3">
                  {rows.map((r) => (
                    <EndpointRow key={r.method + r.path} {...r} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
