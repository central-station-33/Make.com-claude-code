
import { useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import Papa from 'papaparse';
import { useChunkProcessing } from './useChunkProcessing';
import { useFilePreview } from './useFilePreview';
import { useImportLogging } from './useImportLogging';
import { useImportRecord } from './useImportRecord';
import { useImportProgress } from './useImportProgress';
import { ChunkData } from '@/types/import.types';

export const useChunkedImport = (onSuccess?: () => void) => {
  const { toast } = useToast();
  const { processChunk } = useChunkProcessing();
  const { previewData, previewFile } = useFilePreview();
  const { logImportEvent } = useImportLogging();
  const { createImportRecord, updateImportStatus } = useImportRecord();
  const {
    isProcessing,
    setIsProcessing,
    progress,
    setProgress,
    importStatus,
    setImportStatus,
    totalRows,
    setTotalRows
  } = useImportProgress();

  const handleChunk = async (importId: string, results: ChunkData, parser: Papa.Parser) => {
    if (results.data.length === 0) return;
    
    const chunkNumber = Math.floor(results.meta.cursor / 100);
    
    try {
      console.log('Processing chunk:', chunkNumber, 'for import:', importId);
      
      const { successCount, errorCount, retryableRows } = await processChunk(
        importId,
        chunkNumber,
        results.data
      );

      setProgress(results.meta.cursor);

      setImportStatus(prev => ({
        ...prev,
        status: 'processing',
        processedRows: results.meta.cursor,
        successCount: (prev?.successCount || 0) + successCount,
        errorCount: (prev?.errorCount || 0) + errorCount,
      }));

      await updateImportStatus(importId, 'processing', {
        processed_rows: results.meta.cursor,
        success_count: successCount,
        error_count: errorCount,
        current_chunk: chunkNumber,
        retryable_rows: retryableRows,
        can_retry: retryableRows.length > 0
      });
      
      console.log('Chunk processed successfully:', chunkNumber);
    } catch (error) {
      console.error('Error processing chunk:', error);
      await logImportEvent(importId, 'chunk_fatal_error', error instanceof Error ? error.message : 'Unknown error');
      parser.abort();
      throw error;
    }
  };

  const handleFileUpload = useCallback(async (file: File) => {
    setIsProcessing(true);
    setProgress(0);
    setImportStatus({
      status: 'pending',
      filename: file.name,
    });

    try {
      const countRows = () => {
        return new Promise<number>((resolve) => {
          let rowCount = 0;
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            step: () => {
              rowCount++;
            },
            complete: () => {
              resolve(rowCount);
            }
          });
        });
      };

      console.log('Starting import process for file:', file.name);
      const rows = await countRows();
      setTotalRows(rows);

      const importRecord = await createImportRecord(file);
      console.log('Created import record:', importRecord);
      await logImportEvent(importRecord.id, 'import_start', 'Starting import process');

      // Update to processing status with created_at instead of started_at
      await updateImportStatus(importRecord.id, 'processing', {
        status: 'processing',
        created_at: new Date().toISOString()
      });

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        chunk: async (results: ChunkData, parser) => {
          parser.pause();
          await handleChunk(importRecord.id, results, parser);
          parser.resume();
        },
        complete: async () => {
          console.log('Import completed successfully');
          await updateImportStatus(importRecord.id, 'completed', {
            completed_at: new Date().toISOString()
          });
          
          await logImportEvent(importRecord.id, 'import_complete', 'Import process completed');

          setImportStatus(prev => ({
            ...prev,
            status: 'completed'
          }));

          toast({
            title: "Import Completed",
            description: "Your file has been processed successfully.",
          });

          setProgress(totalRows);
          setIsProcessing(false);
          onSuccess?.();
        },
        error: async (error) => {
          console.error('Import error:', error);
          setImportStatus(prev => ({
            ...prev,
            status: 'failed',
            error: error.message
          }));

          await logImportEvent(importRecord.id, 'parse_error', error.message);
          await updateImportStatus(importRecord.id, 'failed', {
            error_details: error.message
          });
          throw new Error(error.message);
        }
      });

    } catch (error) {
      console.error('Import error:', error);
      setImportStatus(prev => ({
        ...prev,
        status: 'failed',
        error: error instanceof Error ? error.message : "Failed to process file"
      }));

      toast({
        variant: "destructive",
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to process file",
      });
      setIsProcessing(false);
    }
  }, [toast, onSuccess, processChunk, logImportEvent, createImportRecord, updateImportStatus]);

  return {
    isProcessing,
    progress,
    previewData,
    handleFileUpload,
    previewFile,
    importStatus
  };
};
