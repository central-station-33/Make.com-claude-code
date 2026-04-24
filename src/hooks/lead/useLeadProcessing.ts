
import { useState } from "react";
import { getCurrentUser, signOut as firebaseSignOut } from "@/integrations/firebase/authHelpers";
import { useToast } from "@/hooks/use-toast";
import { LeadType, LeadStatus } from "@/types/lead";

export const useLeadProcessing = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const processLeadData = async (data: any) => {
    const userResponse = { data: { user: getCurrentUser() } };
    const userId = userResponse.data.user?.uid;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    return {
      name: data.name || `${data.first_name || ''} ${data.last_name || ''}`.trim(),
      email: data.email,
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

  const uploadLeads = async (leads: any[]) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('leads')
        .insert(leads);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Successfully imported ${leads.length} leads`,
      });

    } catch (error: any) {
      console.error('Error uploading leads:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to upload leads"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File, onSuccess?: () => void) => {
    setLoading(true);
    const reader = new FileReader();

    try {
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
              return await processLeadData(lead);
            }));

          await uploadLeads(leads);
          onSuccess?.();
        } catch (error: any) {
          console.error('Processing error:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: error.message || "Failed to process leads",
          });
        } finally {
          setLoading(false);
        }
      };

      reader.readAsText(file);
    } catch (error: any) {
      console.error('File reading error:', error);
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to read file",
      });
    }
  };

  return {
    loading,
    processLeadData,
    uploadLeads,
    handleFileUpload
  };
};
