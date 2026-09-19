import { ReactNode } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

/**
 * Shell for every authenticated page: the app sidebar plus the page's own
 * content. Assumes a SidebarProvider is already mounted above it (it is,
 * app-wide, in main.tsx) -- this component does not add a second one.
 *
 * The sidebar is a fixed column on desktop (md+) and an off-canvas drawer on
 * mobile, so mobile needs a visible way to open it; desktop doesn't need a
 * collapse control for a permanent nav rail, so the trigger bar only renders
 * below md.
 */
export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AppSidebar />
      <SidebarInset>
        <div className="sticky top-0 z-20 flex h-10 items-center border-b border-border bg-background px-2 md:hidden">
          <SidebarTrigger />
        </div>
        {children}
      </SidebarInset>
    </>
  );
}
