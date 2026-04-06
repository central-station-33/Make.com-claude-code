
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { LeadControlSettings, DEFAULT_SETTINGS } from "./types";

export const useLeadControlSettings = () => {
  const [settings, setSettings] = useState<LeadControlSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();
  const MAX_RETRIES = 3;

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('lead_control_settings')
        .select('*')
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setSettings(data);
      } else {
        const { data: newSettings, error: createError } = await supabase
          .from('lead_control_settings')
          .insert([{ ...DEFAULT_SETTINGS, owner_id: user?.id }])
          .select()
          .single();
          
        if (createError) throw createError;
        setSettings(newSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load lead control settings"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('lead_control_settings')
        .upsert({
          ...settings,
          owner_id: user?.id,
          updated_at: new Date().toISOString()
        });

      if (error) {
        if (error.message.includes('Concurrent modification detected') && retryCount < MAX_RETRIES) {
          setRetryCount(prev => prev + 1);
          await loadSettings();
          await saveSettings();
          return;
        }
        throw error;
      }

      toast({
        title: "Success",
        description: "Lead control settings saved successfully"
      });
      
      setRetryCount(0);
      
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error && error.message.includes('Concurrent modification') 
          ? "Someone else modified these settings. Please refresh and try again."
          : "Failed to save lead control settings"
      });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return {
    settings,
    setSettings,
    loading,
    saving,
    saveSettings
  };
};
