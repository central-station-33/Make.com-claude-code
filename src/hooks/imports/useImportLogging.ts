
import { supabase } from "@/integrations/supabase/client";

export const useImportLogging = () => {
  const logImportEvent = async (importId: string, logType: string, message: string, metadata: any = {}) => {
    try {
      await supabase.rpc('log_import_event', {
        p_import_id: importId,
        p_log_type: logType,
        p_message: message,
        p_metadata: metadata
      });
    } catch (error) {
      console.error('Error logging import event:', error);
    }
  };

  return { logImportEvent };
};
