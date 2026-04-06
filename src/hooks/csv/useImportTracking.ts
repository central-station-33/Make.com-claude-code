import { supabase } from "@/integrations/supabase/client";

export const useImportTracking = () => {
  const updateImportProgress = async (
    importId: string, 
    successCount: number, 
    errorCount: number, 
    totalProcessed: number,
    totalRows: number
  ) => {
    await supabase
      .from('lead_imports')
      .update({
        status: totalProcessed >= totalRows ? 'completed' : 'processing',
        processed_rows: totalProcessed,
        success_count: successCount,
        error_count: errorCount
      })
      .eq('id', importId);
  };

  const updateImportError = async (
    importId: string,
    rowData: any,
    errorMessage: string,
    currentErrorCount: number,
    currentProcessed: number
  ) => {
    const errorDetails = [{
      row: rowData,
      error: errorMessage
    }];

    await supabase
      .from('lead_imports')
      .update({
        processed_rows: currentProcessed + 1,
        error_count: currentErrorCount + 1,
        error_details: errorDetails,
        updated_at: new Date().toISOString()
      })
      .eq('id', importId);
  };

  return {
    updateImportProgress,
    updateImportError
  };
};