import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type EmailType = 'invitation' | 'reset' | 'verification';

interface SendEmailParams {
  type: EmailType;
  email: string;
  token?: string;
  name?: string;
  role?: string;
  teamName?: string;
}

export const sendAuthEmail = async ({ type, email, token, name, role, teamName }: SendEmailParams) => {
  try {
    console.log('Attempting to send auth email:', { type, email, token, name, role, teamName });
    
    const { data, error } = await supabase.functions.invoke('send-auth-email', {
      body: { type, email, token, name, role, teamName }
    });

    if (error) {
      console.error('Error sending email:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        statusText: error.statusText
      });
      
      toast({
        variant: "destructive",
        title: "Error sending email",
        description: error.message,
      });
      return false;
    }

    console.log('Email sent successfully:', data);
    return true;
  } catch (error: any) {
    console.error('Error sending email:', error);
    console.error('Full error object:', JSON.stringify(error, null, 2));
    
    toast({
      variant: "destructive",
      title: "Error sending email",
      description: error.message,
    });
    return false;
  }
};