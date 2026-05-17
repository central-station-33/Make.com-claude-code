
import { Home, Settings, MessageSquare, LayoutDashboard, ChartBar, PauseCircle, Sparkles } from "lucide-react";
import SidebarNavItem from "./SidebarNavItem";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const SidebarNav = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      console.log("Current user:", user);
    };
    getUser();
  }, []);

  const mainNavItems = [
    {
      id: "dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
      label: "Dashboard"
    }
  ];

  const agentManagementItems = [
    {
      id: "lead-control",
      path: "/lead-control",
      icon: PauseCircle,
      label: "Lead Control Settings"
    }
  ];

  const communicationItems = [
    {
      id: "messages",
      path: "/messages",
      icon: MessageSquare,
      label: "Messages"
    }
  ];

  const analyticsItems = [
    {
      id: "analytics",
      path: "/analytics",
      icon: ChartBar,
      label: "Analytics"
    }
  ];

  const aiVisibilityItems = [
    {
      id: "ai-visibility",
      path: "/ai-visibility",
      icon: Sparkles,
      label: "F50SEO"
    }
  ];

  const settingsItems = [
    {
      id: "settings",
      path: "/settings",
      icon: Settings,
      label: "Settings"
    }
  ];

  return (
    <nav className="space-y-6 px-2">
      <div className="space-y-1">
        {mainNavItems.map((item) => (
          <SidebarNavItem
            key={item.id}
            path={item.path}
            icon={item.icon}
            label={item.label}
          />
        ))}
      </div>

      <div className="space-y-1">
        <div className="px-3 py-2">
          <h3 className="text-xs font-semibold text-muted-foreground">Lead Management</h3>
        </div>
        {agentManagementItems.map((item) => (
          <SidebarNavItem
            key={item.id}
            path={item.path}
            icon={item.icon}
            label={item.label}
          />
        ))}
      </div>

      <div className="space-y-1">
        <div className="px-3 py-2">
          <h3 className="text-xs font-semibold text-muted-foreground">Communication</h3>
        </div>
        {communicationItems.map((item) => (
          <SidebarNavItem
            key={item.id}
            path={item.path}
            icon={item.icon}
            label={item.label}
          />
        ))}
      </div>

      <div className="space-y-1">
        <div className="px-3 py-2">
          <h3 className="text-xs font-semibold text-muted-foreground">Analytics</h3>
        </div>
        {analyticsItems.map((item) => (
          <SidebarNavItem
            key={item.id}
            path={item.path}
            icon={item.icon}
            label={item.label}
          />
        ))}
      </div>

      <div className="space-y-1">
        <div className="px-3 py-2">
          <h3 className="text-xs font-semibold text-muted-foreground">AI Tools</h3>
        </div>
        {aiVisibilityItems.map((item) => (
          <SidebarNavItem
            key={item.id}
            path={item.path}
            icon={item.icon}
            label={item.label}
          />
        ))}
      </div>

      <div className="space-y-1">
        <div className="px-3 py-2">
          <h3 className="text-xs font-semibold text-muted-foreground">Settings</h3>
        </div>
        {settingsItems.map((item) => (
          <SidebarNavItem
            key={item.id}
            path={item.path}
            icon={item.icon}
            label={item.label}
          />
        ))}
      </div>
    </nav>
  );
};

export default SidebarNav;

