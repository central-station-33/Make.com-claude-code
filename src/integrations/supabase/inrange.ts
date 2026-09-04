import { createClient } from '@supabase/supabase-js';

// InRange distressed property pipeline — separate Supabase project from the main app.
// Set these in Vercel → Project Settings → Environment Variables:
//   VITE_INRANGE_URL  = https://omzugrtgwsjypekuzgtn.supabase.co
//   VITE_INRANGE_KEY  = <anon key from Supabase → Settings → API → anon public>
const url = import.meta.env.VITE_INRANGE_URL as string;
const key = import.meta.env.VITE_INRANGE_KEY as string;

if (!url || !key) {
  console.warn('[InRange] Missing VITE_INRANGE_URL or VITE_INRANGE_KEY — leads page will not load data.');
}

export const inrange = createClient(url ?? '', key ?? '');
