
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { uploadMessageFile } from "@/utils/messageFileUtils";

export const useMessageSender = (leadId: string, currentUser: any) => {
  const { toast } = useToast();

  const handleSend = async (message: string, file?: File) => {
    try {
      let fileMetadata = {};

      if (file) {
        try {
          fileMetadata = await uploadMessageFile(file);
        } catch (error: any) {
          toast({
            variant: "destructive",
            title: "File upload failed",
            description: error.message,
          });
          return;
        }
      }

      const { error: messageError } = await supabase.from("lead_messages").insert({
        lead_id: leadId,
        sender_id: currentUser?.id,
        message: message || file?.name || "",
        metadata: fileMetadata,
        status: 'sent'
      });

      if (messageError) throw messageError;

      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      });
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
      });
    }
  };

  const handleTyping = (isTyping: boolean) => {
    if (!currentUser?.id) return;
    
    const channel = supabase.channel(`typing:${leadId}`);
    channel.track({
      user_id: currentUser.id,
      typing: isTyping,
    });
  };

  return {
    handleSend,
    handleTyping
  };
};
