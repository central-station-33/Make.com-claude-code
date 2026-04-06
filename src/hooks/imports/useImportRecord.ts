
import { supabase } from "@/integrations/supabase/client";
import { ImportRecord } from "@/types/import.types";

const generateUniqueId = () => {
  // Simple unique ID generator that works on all devices
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export const useImportRecord = () => {
  const createImportRecord = async (file: File): Promise<ImportRecord> => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // First create the import record to get an ID
    const { data: importRecord, error: importError } = await supabase
      .from('lead_imports')
      .insert({
        created_by: userId,
        filename: file.name,
        file_format: file.name.split('.').pop()?.toLowerCase(),
        status: 'pending' as const,
        chunk_size: 100,
        error_details: {},
        retryable_rows: {},
        column_mapping: {},
        validation_errors: {},
        import_log: {},
        preview_status: 'not_started',
        lock_attempt_count: 0
      })
      .select()
      .single();

    if (importError) {
      console.error('Import record creation error:', importError);
      throw importError;
    }

    // Now use the import ID to create a deterministic file path
    const filePath = `${userId}/${importRecord.id}/${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    // Upload the file
    const { data: storageData, error: storageError } = await supabase.storage
      .from('leads')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (storageError) {
      console.error('Storage error:', storageError);
      // Clean up the import record if storage upload fails
      await supabase.from('lead_imports').delete().eq('id', importRecord.id);
      throw new Error(`Failed to upload file: ${storageError.message}`);
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('leads')
      .getPublicUrl(filePath);

    // Update the import record with storage details
    const { data: updatedRecord, error: updateError } = await supabase
      .from('lead_imports')
      .update({
        file_path: filePath,
        storage_path: storageData?.path,
        file_url: publicUrl
      })
      .eq('id', importRecord.id)
      .select()
      .single();

    if (updateError) {
      console.error('Import record update error:', updateError);
      // Clean up both the file and record if update fails
      await supabase.storage.from('leads').remove([filePath]);
      await supabase.from('lead_imports').delete().eq('id', importRecord.id);
      throw updateError;
    }

    if (!updatedRecord) {
      throw new Error('No data returned from update operation');
    }

    // Ensure the returned data matches ImportRecord type
    const finalRecord: ImportRecord = {
      ...updatedRecord,
      error_details: updatedRecord.error_details || {},
      retryable_rows: updatedRecord.retryable_rows || {},
      column_mapping: updatedRecord.column_mapping || {},
      validation_errors: updatedRecord.validation_errors || {},
      import_log: updatedRecord.import_log || {}
    };

    return finalRecord;
  };

  const updateImportStatus = async (id: string, status: ImportRecord['status'], details?: Partial<ImportRecord>) => {
    // Ensure details fields are objects if they're Record<string, any> types
    const sanitizedDetails = {
      ...details,
      error_details: details?.error_details || {},
      retryable_rows: details?.retryable_rows || {},
      column_mapping: details?.column_mapping || {},
      validation_errors: details?.validation_errors || {},
      import_log: details?.import_log || {}
    };

    return await supabase
      .from('lead_imports')
      .update({
        status,
        ...sanitizedDetails,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
  };

  return {
    createImportRecord,
    updateImportStatus
  };
};
