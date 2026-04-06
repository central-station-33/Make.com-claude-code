export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

import { AuthTables } from './auth';
import { CRMTables } from './crm';
import { LeadTables } from './leads';
import { MarketingTables } from './marketing';
import { PropertyTables } from './properties';
import { AgentTables } from './agents';
import { SystemTables } from './system';

export interface Database {
  public: {
    Tables: AuthTables & CRMTables & LeadTables & MarketingTables & PropertyTables & AgentTables & SystemTables;
    Views: {
      [key: string]: {
        Row: Record<string, unknown>;
      };
    };
    Functions: {
      [key: string]: unknown;
    };
    Enums: {
      app_role: 'admin' | 'user';
      log_type: 'system' | 'user' | 'error';
      reset_status: 'pending' | 'completed' | 'expired';
    };
  };
}

export interface BaseTable {
  created_at?: string | null;
  updated_at?: string | null;
}

export interface BaseEntity extends BaseTable {
  id: string;
}