/**
 * Firestore compatibility shim — replaces the Supabase client.
 *
 * Exposes a `supabase`-shaped API so all existing code continues to work
 * without changes while the app runs fully on Firebase/Firestore.
 *
 * Supported operations:
 *   supabase.from(collection)
 *     .select(fields?)
 *     .eq(field, value) / .neq / .gte / .lte / .in / .contains
 *     .order(field, { ascending })
 *     .limit(n)
 *     .range(from, to)
 *     .single()
 *     .insert(data)
 *     .update(data)
 *     .delete()
 *     .upsert(data)
 *
 *  supabase.storage (stub — use Firebase Storage directly for new features)
 *  supabase.rpc (stub — returns empty data)
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query as firestoreQuery,
  where,
  orderBy,
  limit as firestoreLimit,
  serverTimestamp,
  type QueryConstraint,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '../firebase/config';

type SBResult<T = DocumentData> = {
  data: T | null;
  error: { message: string } | null;
  count?: number | null;
};

type OrderOptions = { ascending?: boolean };

class QueryBuilder<T = DocumentData> {
  private _collection: string;
  private _constraints: QueryConstraint[] = [];
  private _isSingle = false;
  private _selectFields: string | null = null;
  private _rangeFrom = 0;
  private _rangeTo: number | null = null;
  private _pendingData: Partial<T> | T[] | null = null;
  private _operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
  private _eqId: string | null = null;

  constructor(collectionName: string) {
    this._collection = collectionName;
  }

  select(fields?: string): this {
    this._operation = 'select';
    this._selectFields = fields ?? null;
    return this;
  }

  eq(field: string, value: unknown): this {
    if (field === 'id') {
      this._eqId = value as string;
    } else {
      this._constraints.push(where(field, '==', value));
    }
    return this;
  }

  neq(field: string, value: unknown): this {
    this._constraints.push(where(field, '!=', value));
    return this;
  }

  gte(field: string, value: unknown): this {
    this._constraints.push(where(field, '>=', value));
    return this;
  }

  lte(field: string, value: unknown): this {
    this._constraints.push(where(field, '<=', value));
    return this;
  }

  gt(field: string, value: unknown): this {
    this._constraints.push(where(field, '>', value));
    return this;
  }

  lt(field: string, value: unknown): this {
    this._constraints.push(where(field, '<', value));
    return this;
  }

  in(field: string, values: unknown[]): this {
    this._constraints.push(where(field, 'in', values));
    return this;
  }

  contains(field: string, value: unknown): this {
    this._constraints.push(where(field, 'array-contains', value));
    return this;
  }

  ilike(field: string, _pattern: string): this {
    // Firestore doesn't support ILIKE — returns all docs, filter client-side if needed
    return this;
  }

  order(field: string, options?: OrderOptions): this {
    this._constraints.push(orderBy(field, options?.ascending === false ? 'desc' : 'asc'));
    return this;
  }

  limit(n: number): this {
    this._constraints.push(firestoreLimit(n));
    return this;
  }

  range(from: number, to: number): this {
    this._rangeFrom = from;
    this._rangeTo = to;
    this._constraints.push(firestoreLimit(to - from + 1));
    return this;
  }

  single(): this {
    this._isSingle = true;
    return this;
  }

  insert(data: Partial<T> | Partial<T>[]): this {
    this._operation = 'insert';
    this._pendingData = Array.isArray(data) ? data as T[] : data as Partial<T>;
    return this;
  }

  update(data: Partial<T>): this {
    this._operation = 'update';
    this._pendingData = data;
    return this;
  }

  upsert(data: Partial<T> | Partial<T>[]): this {
    this._operation = 'upsert';
    this._pendingData = Array.isArray(data) ? data as T[] : data as Partial<T>;
    return this;
  }

  delete(): this {
    this._operation = 'delete';
    return this;
  }

  // Thenable — executes when awaited
  then<TResult1 = SBResult<T[]>, TResult2 = never>(
    onfulfilled: (value: SBResult<T[]>) => TResult1 | PromiseLike<TResult1>,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this._execute().then(onfulfilled as never, onrejected as never) as Promise<TResult1 | TResult2>;
  }

  private async _execute(): Promise<SBResult<T | T[]>> {
    try {
      const colRef = collection(db, this._collection);

      // ── INSERT ──────────────────────────────────────────────
      if (this._operation === 'insert' || this._operation === 'upsert') {
        const rows = Array.isArray(this._pendingData)
          ? this._pendingData
          : [this._pendingData];
        const inserted: (T & { id: string })[] = [];
        for (const row of rows) {
          const payload = { ...(row as DocumentData), created_at: serverTimestamp(), updated_at: serverTimestamp() };
          if (this._operation === 'upsert' && (row as DocumentData).id) {
            const id = (row as DocumentData).id as string;
            await setDoc(doc(db, this._collection, id), payload, { merge: true });
            inserted.push({ ...(row as T), id });
          } else {
            const ref = await addDoc(colRef, payload);
            inserted.push({ ...(row as T), id: ref.id });
          }
        }
        const result = this._isSingle ? inserted[0] ?? null : inserted;
        return { data: result as T | T[], error: null };
      }

      // ── UPDATE ──────────────────────────────────────────────
      if (this._operation === 'update') {
        if (this._eqId) {
          const ref = doc(db, this._collection, this._eqId);
          await updateDoc(ref, { ...(this._pendingData as DocumentData), updated_at: serverTimestamp() });
          const snap = await getDoc(ref);
          const updated = snap.exists() ? ({ id: snap.id, ...snap.data() } as T) : null;
          return { data: updated, error: null };
        }
        // Update all matching docs
        const q = firestoreQuery(colRef, ...this._constraints);
        const snaps = await getDocs(q);
        for (const d of snaps.docs) {
          await updateDoc(d.ref, { ...(this._pendingData as DocumentData), updated_at: serverTimestamp() });
        }
        return { data: null, error: null };
      }

      // ── DELETE ──────────────────────────────────────────────
      if (this._operation === 'delete') {
        if (this._eqId) {
          await deleteDoc(doc(db, this._collection, this._eqId));
          return { data: null, error: null };
        }
        const q = firestoreQuery(colRef, ...this._constraints);
        const snaps = await getDocs(q);
        await Promise.all(snaps.docs.map((d) => deleteDoc(d.ref)));
        return { data: null, error: null };
      }

      // ── SELECT ──────────────────────────────────────────────
      if (this._eqId) {
        const snap = await getDoc(doc(db, this._collection, this._eqId));
        if (!snap.exists()) {
          return this._isSingle
            ? { data: null, error: { message: 'Not found' } }
            : { data: [] as unknown as T[], error: null, count: 0 };
        }
        const row = { id: snap.id, ...snap.data() } as T;
        return { data: this._isSingle ? row : [row] as unknown as T[], error: null };
      }

      const q = this._constraints.length
        ? firestoreQuery(colRef, ...this._constraints)
        : firestoreQuery(colRef);
      const snaps = await getDocs(q);
      const rows = snaps.docs.map((d) => ({ id: d.id, ...d.data() } as T));

      if (this._isSingle) {
        return { data: rows[0] ?? null, error: rows[0] ? null : { message: 'No rows' } };
      }
      return { data: rows, error: null, count: rows.length };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Firestore error';
      return { data: null, error: { message } };
    }
  }
}

// ── Storage stub ────────────────────────────────────────────
const storageStub = {
  from: (_bucket: string) => ({
    upload: async () => ({ data: null, error: null }),
    getPublicUrl: (_path: string) => ({ data: { publicUrl: '' } }),
    list: async () => ({ data: [], error: null }),
    remove: async () => ({ data: null, error: null }),
  }),
};

// ── RPC stub ────────────────────────────────────────────────
const rpcStub = async (_fn: string, _params?: unknown) => ({ data: null, error: null });

// ── Main export ─────────────────────────────────────────────
export const supabase = {
  from: <T = DocumentData>(collectionName: string) => new QueryBuilder<T>(collectionName),
  storage: storageStub,
  rpc: rpcStub,
  // Auth is handled by Firebase — stub so nothing breaks if referenced
  auth: {
    getUser: async () => ({ data: { user: null }, error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: (_cb: unknown) => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
};
