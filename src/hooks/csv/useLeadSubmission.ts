import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useLeadSubmission = () => {
  const { toast } = useToast();

  const createImportRecord = async (userId: string, totalRows: number) => {
    const { data: importRecord, error: importError } = await supabase
      .from('lead_imports')
      .insert({
        filename: 'import_' + new Date().toISOString(),
        file_format: 'csv',
        created_by: userId,
        total_rows: totalRows,
        status: 'processing'
      })
      .select()
      .single();

    if (importError) {
      console.error('Error creating import record:', importError);
      toast({
        variant: "destructive",
        title: "Import Error",
        description: "Failed to create import record"
      });
      return null;
    }

    return importRecord;
  };

  const insertLead = async (leadData: any, userId: string) => {
    try {
      const { error } = await supabase
        .from("leads")
        .insert({
          name: leadData.name || `${leadData.first_name} ${leadData.last_name}`,
          email: leadData.email,
          phone: leadData.phone || null,
          type: leadData.type,
          status: 'New',
          location: leadData.address ? `${leadData.address}, ${leadData.city}, ${leadData.state}` : null,
          user_id: userId,
          distribution_status: 'pending'
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error(`Error importing lead ${leadData.name || `${leadData.first_name} ${leadData.last_name}`}:`, error);
      return false;
    }
  };

  return {
    createImportRecord,
    insertLead
  };
};