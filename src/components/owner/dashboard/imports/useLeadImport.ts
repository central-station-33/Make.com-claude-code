import { useState } from "react";
import { getCurrentUser, signOut as firebaseSignOut } from "@/integrations/firebase/authHelpers";
import { useToast } from "@/hooks/use-toast";
import { LeadStatus, LeadType } from "@/types/lead";

export const useLeadImport = (onSuccess: () => void) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const validateLeadData = (data: any) => {
    if (!data.name && !data.email && !data.phone) {
      throw new Error('Name and at least one contact method (email or phone) are required');
    }
    return true;
  };

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

  const handleFileUpload = async (file: File) => {
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

          console.log('Processing leads:', leads);

          const { error } = await supabase
            .from('leads')
            .insert(leads);

          if (error) {
            console.error('Supabase error:', error);
            throw error;
          }

          toast({
            title: "Success",
            description: `Successfully imported ${leads.length} leads`,
          });

          onSuccess();
        } catch (error) {
          console.error('Processing error:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: error instanceof Error ? error.message : "Failed to import leads",
          });
        } finally {
          setLoading(false);
        }
      };

      reader.readAsText(file);
    } catch (error) {
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
    handleFileUpload
  };
};