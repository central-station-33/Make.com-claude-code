
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LeadStatus, LeadType } from "@/types/lead";
import { validateLead } from "@/utils/leadValidation";

export interface LeadImportHookReturn {
  loading: boolean;
  handleUpload: (file: File) => Promise<void>;
  isUploading: boolean;
}

export const useLeadImport = (onSuccess: () => void): LeadImportHookReturn => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const processLeadData = async (data: any) => {
    const userResponse = await supabase.auth.getUser();
    const userId = userResponse.data.user?.id;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    return {
      name: data.name || `${data.first_name || ''} ${data.last_name || ''}`.trim(),
      email: data.email || null,
      phone: data.phone || null,
      type: (data.type?.toUpperCase() as LeadType) || LeadType.BUYER,
      status: LeadStatus.NEW,
      property_type: data.property_type || null,
      budget: data.budget ? Number(data.budget) : null,
      location: data.location || null,
      notes: data.notes || null,
      user_id: userId,
      distribution_status: 'pending'
    };
  };

  const handleUpload = async (file: File) => {
    setLoading(true);
    const reader = new FileReader();

    return new Promise<void>((resolve, reject) => {
      reader.onload = async (e) => {
        try {
          if (!e.target?.result) {
            throw new Error('Failed to read file');
          }

          const csvContent = e.target.result as string;
          const rows = csvContent.split('\n').map(row => row.split(','));
          const headers = rows[0];
          
          const leads = await Promise.all(rows.slice(1)
            .filter(row => row.length === headers.length && row.some(cell => cell.trim()))
            .map(async row => {
              const lead: Record<string, string> = {};
              headers.forEach((header, index) => {
                lead[header.trim()] = row[index]?.trim() || '';
              });
              const processedLead = await processLeadData(lead);
              return validateLead(processedLead);
            }));

          const { error } = await supabase
            .from('leads')
            .insert(leads);

          if (error) {
            throw error;
          }

          toast({
            title: "Success",
            description: `Successfully imported ${leads.length} leads`,
          });

          onSuccess();
          resolve();
        } catch (error) {
          console.error('Processing error:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: error instanceof Error ? error.message : "Failed to import leads",
          });
          reject(error);
        } finally {
          setLoading(false);
        }
      };

      reader.readAsText(file);
    });
  };

  return {
    loading,
    handleUpload,
    isUploading: loading
  };
};
