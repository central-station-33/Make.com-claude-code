
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UploadResult {
  error: Error | null;
}

export const useFileUpload = (onSuccess: () => void) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadTimeout, setUploadTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (uploadTimeout) {
        clearTimeout(uploadTimeout);
      }
    };
  }, [uploadTimeout]);

  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      setUploadProgress(0);

      const timeout = setTimeout(() => {
        if (isUploading) {
          setIsUploading(false);
          setUploadProgress(0);
          toast({
            variant: "destructive",
            title: "Upload Timeout",
            description: "The upload is taking too long. Please try again.",
          });
        }
      }, 120000);
      setUploadTimeout(timeout);

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Auth error:', authError);
        throw authError;
      }

      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('Starting upload with authenticated user:', user.id);

      // Create import record first
      const { data: importRecord, error: importError } = await supabase
        .from('lead_imports')
        .insert({
          filename: file.name,
          file_format: file.name.split('.').pop() || 'unknown',
          status: 'pending',
          source: 'manual_upload',
          created_by: user.id
        })
        .select()
        .single();

      if (importError) {
        console.error('Import record creation error:', importError);
        throw importError;
      }

      console.log('Created import record:', importRecord);

      // Generate a clean file path
      const filePath = `${importRecord.id}/${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      
      console.log('Attempting upload to path:', filePath);

      // Check if file already exists
      const { data: existingFile } = await supabase.storage
        .from('imports')
        .list(importRecord.id);

      if (existingFile && existingFile.length > 0) {
        console.log('Found existing file, will upsert');
      }

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('imports')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }

      console.log('File uploaded successfully to storage');

      // Update import record with file path
      const { error: updateError } = await supabase
        .from('lead_imports')
        .update({
          file_path: filePath,
          status: 'processing',
          processed_rows: 0,
          total_rows: 0
        })
        .eq('id', importRecord.id);

      if (updateError) {
        console.error('Import record update error:', updateError);
        throw updateError;
      }

      console.log('Import record updated with file path');
      
      if (uploadTimeout) clearTimeout(uploadTimeout);
      toast({
        title: "Upload Successful",
        description: "Your file has been uploaded successfully.",
      });
      onSuccess();

    } catch (error) {
      console.error('Full upload error:', error);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
      });
    } finally {
      if (uploadTimeout) clearTimeout(uploadTimeout);
      setUploadTimeout(null);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return {
    isUploading,
    uploadProgress,
    handleFileUpload
  };
};
