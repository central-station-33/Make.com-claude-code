import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_INRANGE_URL as string;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_INRANGE_KEY as string;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
