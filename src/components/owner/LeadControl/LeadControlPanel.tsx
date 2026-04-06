
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { LeadControlForm } from "./LeadControlForm";
import { useLeadControlSettings } from "./useLeadControlSettings";

export const LeadControlPanel = () => {
  const {
    settings,
    setSettings,
    loading,
    saving,
    saveSettings
  } = useLeadControlSettings();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Lead Control Settings</h2>
      <LeadControlForm
        settings={settings}
        onSettingChange={setSettings}
        onSave={saveSettings}
        saving={saving}
      />
    </Card>
  );
};
