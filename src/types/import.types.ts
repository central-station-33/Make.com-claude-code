
import { Json } from './json.types';

export type LeadImportStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ImportStatus {
  status: LeadImportStatus;
  filename?: string;
  processedRows?: number;
  successCount?: number;
  errorCount?: number;
  error?: string;
  canRetry?: boolean;
  deadlockCount?: number;
}

export interface ImportRecord {
  id: string;
  filename: string;
  file_format: string | null;
  status: LeadImportStatus;
  chunk_size: number;
  success_count?: number;
  error_count?: number;
  processed_rows?: number;
  error_details: Json;
  retryable_rows: Json;
  can_retry?: boolean;
  current_chunk?: number;
  created_at?: string;
  updated_at?: string;
  file_path?: string | null;
  storage_path?: string | null;
  file_url?: string;
  column_mapping: Json;
  validation_errors: Json;
  import_log: Json;
  total_rows?: number;
  source?: string | null;
  created_by: string;  // Make this required
  preview_status?: string;
  lock_attempt_count?: number;
  deadlock_count?: number;
  completed_at?: string | null;
  last_deadlock_at?: string | null;
}

export interface ChunkResult {
  successCount: number;
  errorCount: number;
  retryableRows: any[];
}

export interface ChunkData {
  data: any[];
  errors: any[];
  meta: {
    cursor: number;
  };
}
