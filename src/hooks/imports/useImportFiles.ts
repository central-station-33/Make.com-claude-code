
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ImportFile {
  id: string;
  filename: string;
  file_format: string;
  status: string;
  created_at: string;
  file_path: string;
  success_count: number | null;
  error_count: number | null;
  total_rows: number | null;
  processed_rows: number | null;
}

export const useImportFiles = () => {
  return useQuery({
    queryKey: ["import-files"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_import_files')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching import files:', error);
        throw error;
      }

      return data as ImportFile[];
    }
  });
};
