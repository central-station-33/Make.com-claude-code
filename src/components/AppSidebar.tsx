
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { SidebarLogo } from "./sidebar/SidebarLogo";
import SidebarNav from "./sidebar/SidebarNav";

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="border-b border-border px-6 py-4">
        <SidebarLogo />
      </SidebarHeader>
      <SidebarContent className="px-2 py-4">
        <SidebarNav />
      </SidebarContent>
    </Sidebar>
  );
}
