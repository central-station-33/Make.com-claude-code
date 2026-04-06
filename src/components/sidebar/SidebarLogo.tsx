
import { Building2 } from "lucide-react";

export function SidebarLogo() {
  return (
    <div className="flex items-center gap-3">
      <Building2 className="h-6 w-6 text-primary" />
      <span className="font-semibold text-lg tracking-tight">LeadGenie</span>
    </div>
  );
}
