
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { SidebarLogo } from "./sidebar/SidebarLogo";
import SidebarNav from "./sidebar/SidebarNav";
import { SidebarUserFooter } from "./sidebar/SidebarUserFooter";

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="border-b border-border px-6 py-4">
        <SidebarLogo />
      </SidebarHeader>
      <SidebarContent className="px-2 py-4">
        <SidebarNav />
      </SidebarContent>
      <SidebarFooter className="border-t border-border px-3 py-3">
        <SidebarUserFooter />
      </SidebarFooter>
    </Sidebar>
  );
}
