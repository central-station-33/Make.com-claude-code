import { Json } from '../base.types';

export interface SystemLogRow {
  id: string;
  timestamp: string;
  action: string;
  details: string | null;
  type: string;
  user_id: string | null;
  created_at: string | null;
}

export interface SavedSearchRow {
  id: string;
  user_id: string | null;
  search_params: Json;
  name: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface SystemTables {
  system_logs: {
    Row: SystemLogRow;
    Insert: Omit<SystemLogRow, 'id' | 'created_at'>;
    Update: Partial<Omit<SystemLogRow, 'id'>>;
  };
  saved_searches: {
    Row: SavedSearchRow;
    Insert: Omit<SavedSearchRow, 'id' | 'created_at' | 'updated_at'>;
    Update: Partial<Omit<SavedSearchRow, 'id'>>;
  };
}