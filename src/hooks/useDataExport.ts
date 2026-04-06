
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface ExportOptions {
  tableName: string;
  column: string;
  whereClause?: Record<string, any>;
  destinationPath?: string;
}

export const useDataExport = () => {
  const { toast } = useToast();
  const { session } = useAuth();

  const exportToStorage = async (options: ExportOptions) => {
    try {
      if (!session?.access_token) {
        console.error('No access token available');
        throw new Error('Authentication required');
      }

      console.log('Attempting function invocation with token:', session.access_token.slice(0, 10) + '...');

      const { data, error } = await supabase.functions.invoke('db-to-storage', {
        body: options,
        headers: {
          Authorization: session.access_token
        }
      });

      if (error) {
        console.error('Function invocation error:', error);
        throw error;
      }

      toast({
        title: "Export Successful",
        description: "Data has been exported to storage successfully.",
      });

      return data;
    } catch (error) {
      console.error('Export error:', error);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export data",
      });
      throw error;
    }
  };

  return { exportToStorage };
};
