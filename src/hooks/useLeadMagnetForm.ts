import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LeadType } from "@/types/lead";
import { generateLeadMagnetContent, downloadContent } from "@/utils/leadMagnetContent";

interface FormData {
  name: string;
  email: string;
  phone: string;
}

export const useLeadMagnetForm = () => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
  });
  const { toast } = useToast();

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFormSubmit = async (
    e: React.FormEvent,
    selectedMagnet: { title: string; type: string; } | null,
    onSuccess: () => void
  ) => {
    e.preventDefault();
    
    try {
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .insert([
          {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            type: LeadType.BUYER,
            status: 'New',
          }
        ])
        .select()
        .single();

      if (leadError) throw leadError;

      const { error: interactionError } = await supabase
        .from('lead_magnet_interactions')
        .insert([
          {
            lead_id: leadData.id,
            magnet_type: selectedMagnet?.type,
            content_title: selectedMagnet?.title,
            metadata: {
              userAgent: navigator.userAgent,
              timestamp: new Date().toISOString(),
            },
          }
        ]);

      if (interactionError) throw interactionError;

      toast({
        title: "Success!",
        description: "Your download will begin shortly.",
      });

      const { content, filename } = generateLeadMagnetContent(selectedMagnet?.type);
      downloadContent(content, filename);

      setFormData({ name: "", email: "", phone: "" });
      onSuccess();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "There was a problem processing your request.",
        variant: "destructive",
      });
    }
  };

  return {
    formData,
    handleFormChange,
    handleFormSubmit,
  };
};