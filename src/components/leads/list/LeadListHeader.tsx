
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LeadListHeaderProps {
  onUploadSuccess: () => void;
}

export const LeadListHeader = ({ onUploadSuccess }: LeadListHeaderProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportLeads = async () => {
    try {
      setIsExporting(true);
      const { data: leads, error } = await supabase
        .from('leads')
        .select('name, email, phone, type, status, property_type, budget, location, notes')
        .csv();

      if (error) throw error;

      // Create and download CSV file
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

  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h2 className="text-2xl font-semibold">Leads</h2>
        <p className="text-muted-foreground">Manage and track your leads</p>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={() => navigate("/leads/new")}
          className="whitespace-nowrap"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Lead
        </Button>
        <Button 
          onClick={handleExportLeads} 
          disabled={isExporting}
          variant="outline"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Leads
        </Button>
      </div>
    </div>
  );
};
