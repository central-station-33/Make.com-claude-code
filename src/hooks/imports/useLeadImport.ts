
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UseLeadImportReturn {
  isUploading: boolean;
  progress: number;
  handleFileUpload: (file: File) => Promise<void>;
}

export const useLeadImport = (onSuccess?: () => void): UseLeadImportReturn => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      setProgress(0);

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { data: importRecord, error: importError } = await supabase
        .from('lead_imports')
        .insert({
          filename: file.name,
          file_format: file.name.split('.').pop()?.toLowerCase() || 'unknown',
          status: 'pending',
          created_by: user.id,
          source: 'manual_upload'
        })
        .select()
        .single();

      if (importError) {
        throw importError;
      }

      // Generate a clean file path
      const filePath = `${importRecord.id}/${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('imports')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      // Update import record with file path
      const { error: updateError } = await supabase
        .from('lead_imports')
        .update({
          file_path: filePath,
          status: 'processing'
        })
        .eq('id', importRecord.id);

      if (updateError) {
        throw updateError;
      }

      toast({
        title: "Upload Successful",
        description: "Your file has been uploaded and will be processed shortly.",
      });

      onSuccess?.();

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
      });
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  return {
    isUploading,
    progress,
    handleFileUpload
  };
};
