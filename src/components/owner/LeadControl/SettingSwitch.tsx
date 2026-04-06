
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface SettingSwitchProps {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export const SettingSwitch = ({
  label,
  description,
  checked,
  onCheckedChange
}: SettingSwitchProps) => {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label>{label}</Label>
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
};
