
import { supabase } from "@/integrations/supabase/client";
import { useImportLogging } from "./useImportLogging";

export const useChunkProcessing = () => {
  const { logImportEvent } = useImportLogging();

  const processChunk = async (
    importId: string, 
    chunkNumber: number, 
    chunkData: any[]
  ) => {
    try {
      await logImportEvent(importId, 'chunk_start', `Processing chunk ${chunkNumber}`, {
        chunk_number: chunkNumber,
        row_count: chunkData.length
      });

      const { error } = await supabase
        .from('lead_import_chunks')
        .insert({
          import_id: importId,
          chunk_number: chunkNumber,
          status: 'processing'
        });

      if (error) throw error;

      let successCount = 0;
      let errorCount = 0;
      const errorDetails = [];
      const retryableRows = [];

      for (const row of chunkData) {
        try {
          if (!row.email && !row.phone) {
            throw new Error('Either email or phone is required');
          }

          const { error: insertError } = await supabase.from('leads').insert({
            name: row.name || `${row.first_name || ''} ${row.last_name || ''}`.trim(),
            email: row.email,
            phone: row.phone,
            type: row.type?.toUpperCase() || 'BUYER',
            status: 'New',
            source: 'import'
          });

          if (insertError) {
            throw insertError;
          }

          successCount++;
          await logImportEvent(importId, 'row_success', 'Row processed successfully', { row });
        } catch (err) {
          errorCount++;
          const isRetryable = err.message.includes('duplicate key') || 
                             err.message.includes('temporarily unavailable');
          
          if (isRetryable) {
            retryableRows.push(row);
          }

          errorDetails.push({
            row: row,
            error: err instanceof Error ? err.message : 'Unknown error',
            is_retryable: isRetryable
          });

          await logImportEvent(importId, 'row_error', err instanceof Error ? err.message : 'Unknown error', {
            row,
            is_retryable: isRetryable
          });
        }
      }

      await supabase
        .from('lead_import_chunks')
        .update({
          status: 'completed',
          processed_rows: chunkData.length,
          success_count: successCount,
          error_count: errorCount,
          error_details: errorDetails
        })
        .eq('import_id', importId)
        .eq('chunk_number', chunkNumber);

      await logImportEvent(importId, 'chunk_complete', `Completed chunk ${chunkNumber}`, {
        success_count: successCount,
        error_count: errorCount,
        retryable_rows: retryableRows.length
      });

      return { successCount, errorCount, retryableRows };
    } catch (error) {
      console.error('Chunk processing error:', error);
      await logImportEvent(importId, 'chunk_error', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  };

  return { processChunk };
};
