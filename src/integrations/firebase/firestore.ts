// Supabase-backed compatibility shim — keeps the same CRUD API as the old Firebase/Firestore helpers
import { supabase } from '@/integrations/supabase/client';

export const COLLECTIONS = {
  USER_ROLES: 'user_roles',
  PROFILES: 'profiles',
  LEADS: 'leads',
  MESSAGES: 'messages',
  IMPORT_RECORDS: 'import_records',
  WIRE_CONTACTS: 'wire_contacts',
  WIRE_CONVERSATIONS: 'wire_conversations',
  WIRE_MESSAGES: 'wire_messages',
  WIRE_PIPELINES: 'wire_pipelines',
  WIRE_PIPELINE_STAGES: 'wire_pipeline_stages',
  WIRE_OPPORTUNITIES: 'wire_opportunities',
  WIRE_APPOINTMENTS: 'wire_appointments',
  WIRE_AUTOMATIONS: 'wire_automations',
  WIRE_CAMPAIGNS: 'wire_campaigns',
  WIRE_API_KEYS: 'wire_api_keys',
} as const;

export type SimpleConstraint =
  | { type: 'where'; field: string; op: string; value: unknown }
  | { type: 'orderBy'; field: string; dir?: 'asc' | 'desc' }
  | { type: 'limit'; n: number };

export function where(field: string, op: string, value: unknown): SimpleConstraint {
  return { type: 'where', field, op, value };
}

export function orderBy(field: string, direction?: 'asc' | 'desc'): SimpleConstraint {
  return { type: 'orderBy', field, dir: direction };
}

export function limit(n: number): SimpleConstraint {
  return { type: 'limit', n };
}

export const serverTimestamp = () => new Date().toISOString();

function applyConstraints(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  q: any,
  constraints: SimpleConstraint[]
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  for (const c of constraints) {
    if (c.type === 'where') {
      if (c.op === '==' || c.op === '===') q = q.eq(c.field, c.value);
      else if (c.op === '!=' || c.op === '!==') q = q.neq(c.field, c.value);
      else if (c.op === '>') q = q.gt(c.field, c.value);
      else if (c.op === '>=') q = q.gte(c.field, c.value);
      else if (c.op === '<') q = q.lt(c.field, c.value);
      else if (c.op === '<=') q = q.lte(c.field, c.value);
      else if (c.op === 'array-contains') q = q.contains(c.field, [c.value]);
    } else if (c.type === 'orderBy') {
      q = q.order(c.field, { ascending: c.dir !== 'desc' });
    } else if (c.type === 'limit') {
      q = q.limit(c.n);
    }
  }
  return q;
}

export async function getDocument<T = Record<string, unknown>>(
  collectionName: string,
  id: string
): Promise<(T & { id: string }) | null> {
  const { data, error } = await supabase.from(collectionName).select('*').eq('id', id).single();
  if (error) { console.warn(`getDocument(${collectionName}, ${id}):`, error.message); return null; }
  return data as T & { id: string };
}

export async function getDocuments<T = Record<string, unknown>>(
  collectionName: string,
  constraints: SimpleConstraint[] = []
): Promise<(T & { id: string })[]> {
  let q = supabase.from(collectionName).select('*');
  q = applyConstraints(q, constraints);
  const { data, error } = await q;
  if (error) { console.warn(`getDocuments(${collectionName}):`, error.message); return []; }
  return (data ?? []) as (T & { id: string })[];
}

export async function createDocument<T extends Record<string, unknown>>(
  collectionName: string,
  data: T
): Promise<string> {
  const { data: row, error } = await supabase
    .from(collectionName)
    .insert({ ...data, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .select('id')
    .single();
  if (error) { console.warn(`createDocument(${collectionName}):`, error.message); return ''; }
  return (row as { id: string }).id;
}

export async function updateDocument(
  collectionName: string,
  id: string,
  data: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase
    .from(collectionName)
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) console.warn(`updateDocument(${collectionName}, ${id}):`, error.message);
}

export async function deleteDocument(collectionName: string, id: string): Promise<void> {
  const { error } = await supabase.from(collectionName).delete().eq('id', id);
  if (error) console.warn(`deleteDocument(${collectionName}, ${id}):`, error.message);
}

export function subscribeToCollection<T = Record<string, unknown>>(
  collectionName: string,
  constraints: SimpleConstraint[],
  callback: (docs: (T & { id: string })[]) => void
): () => void {
  // Initial fetch
  getDocuments<T>(collectionName, constraints).then(callback);

  const channel = supabase
    .channel(`shim_${collectionName}_${Date.now()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: collectionName }, () => {
      getDocuments<T>(collectionName, constraints).then(callback);
    })
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}
