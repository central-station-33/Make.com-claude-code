import { BaseEntity } from './base';

export interface SystemTables {
  system_logs: {
    Row: SystemLogRow;
    Insert: SystemLogInsert;
    Update: SystemLogUpdate;
  };
  saved_searches: {
    Row: SavedSearchRow;
    Insert: SavedSearchInsert;
    Update: SavedSearchUpdate;
  };
}

export interface SystemLogRow extends BaseEntity {
  timestamp: string;
  action: string;
  details: string | null;
  type: 'system' | 'user' | 'error';
  user_id: string | null;
}

export type SystemLogInsert = Partial<SystemLogRow>;
export type SystemLogUpdate = Partial<SystemLogRow>;

export interface SavedSearchRow extends BaseEntity {
  user_id: string | null;
  search_params: Record<string, unknown>;
  name: string;
}

export type SavedSearchInsert = Partial<SavedSearchRow>;
export type SavedSearchUpdate = Partial<SavedSearchRow>;