import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Lead } from "@/types/lead";

export const useEmailLead = (lead: Lead) => {
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState<string>("");
  const [recipientEmail, setRecipientEmail] = useState(lead.email || "");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const { data: marketingMaterials } = useQuery({
    queryKey: ["marketingMaterials", lead.type],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_materials")
        .select("*")
        .eq("type", lead.type)
        .order('title');
      
      if (error) throw error;
      return data;
    }
  });

  const handleSendEmail = async () => {
    if (!recipientEmail) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Recipient email is required",
      });
      return;
    }

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from("lead_email_communications")
        .insert({
          lead_id: lead.id,
          sender_id: (await supabase.auth.getUser()).data.user?.id,
          material_id: selectedMaterial,
          subject,
          content,
          metadata: {
            recipient_email: recipientEmail
          }
        });

      if (error) throw error;

      toast({
        title: "Email sent successfully",
        description: "Your email has been sent to the lead.",
      });

      setSubject("");
      setContent("");
      setSelectedMaterial("");
    } catch (error) {
      console.error("Error sending email:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send email. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    subject,
    setSubject,
    content,
    setContent,
    selectedMaterial,
    setSelectedMaterial,
    recipientEmail,
    setRecipientEmail,
    isLoading,
    marketingMaterials,
    handleSendEmail
  };
};