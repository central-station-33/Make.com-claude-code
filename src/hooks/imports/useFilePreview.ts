
import { useState, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import Papa from 'papaparse';

export const useFilePreview = () => {
  const [previewData, setPreviewData] = useState<any[]>([]);
  const { toast } = useToast();

  const previewFile = useCallback(async (file: File) => {
    try {
      Papa.parse(file, {
        header: true,
        preview: 5,
        skipEmptyLines: true,
        complete: (results) => {
          setPreviewData(results.data);
        },
        error: (error) => {
          throw new Error(error.message);
        }
      });
    } catch (error) {
      console.error('Preview error:', error);
      toast({
        variant: "destructive",
        title: "Preview Failed",
        description: error instanceof Error ? error.message : "Failed to preview file",
      });
    }
  }, [toast]);

  return { previewData, previewFile };
};
