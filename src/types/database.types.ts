
import { Database as GeneratedDatabase } from '@/integrations/supabase/types';

export interface Database extends GeneratedDatabase {}

export type { DatabaseTables } from './database';
export type { DatabaseViews } from './database';
export type { DatabaseFunctions } from './database';
export type { DatabaseEnums } from './database';
