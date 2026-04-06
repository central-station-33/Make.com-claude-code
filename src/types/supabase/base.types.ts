
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface BaseRow {
  created_at?: string | null;
  updated_at?: string | null;
}

export interface BaseTable {
  Row: BaseRow;
  Insert: BaseRow;
  Update: Partial<BaseRow>;
}
