
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useLeadsExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExportLeads = async () => {
    try {
      setIsExporting(true);
      const { data: leads, error } = await supabase
        .from('leads')
        .select('name, email, phone, type, status, property_type, budget, location, notes')
        .csv();

      if (error) throw error;

      const blob = new Blob([leads], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Leads exported successfully",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to export leads",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return {
    isExporting,
    handleExportLeads
  };
};
