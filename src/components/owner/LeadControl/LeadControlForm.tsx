
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { SettingSwitch } from "./SettingSwitch";
import { LeadControlSettings } from "./types";

interface LeadControlFormProps {
  settings: LeadControlSettings | null;
  onSettingChange: (settings: LeadControlSettings) => void;
  onSave: () => void;
  saving: boolean;
}

export const LeadControlForm = ({
  settings,
  onSettingChange,
  onSave,
  saving
}: LeadControlFormProps) => {
  if (!settings) return null;

  const handleSettingChange = <K extends keyof LeadControlSettings>(
    key: K,
    value: LeadControlSettings[K]
  ) => {
    onSettingChange({ ...settings, [key]: value });
  };

  return (
    <div className="space-y-4">
      <SettingSwitch
        label="Automatic Lead Assignment"
        description="Automatically assign new leads to agents"
        checked={settings.auto_assign_enabled}
        onCheckedChange={(checked) => handleSettingChange('auto_assign_enabled', checked)}
      />

      <SettingSwitch
        label="Pause Lead Distribution"
        description="Temporarily stop distributing new leads"
        checked={settings.pause_distribution}
        onCheckedChange={(checked) => handleSettingChange('pause_distribution', checked)}
      />

      <SettingSwitch
        label="Archive Instead of Delete"
        description="Archive leads instead of permanently deleting them"
        checked={settings.archive_instead_of_delete}
        onCheckedChange={(checked) => handleSettingChange('archive_instead_of_delete', checked)}
      />

      <div className="space-y-2">
        <Label>Daily Lead Limit per Agent</Label>
        <Input
          type="number"
          min="1"
          max="100"
          value={settings.daily_lead_limit}
          onChange={(e) => handleSettingChange('daily_lead_limit', parseInt(e.target.value))}
        />
      </div>

      <Button 
        onClick={onSave} 
        disabled={saving}
        className="w-full"
      >
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : 'Save Settings'}
      </Button>
    </div>
  );
};
