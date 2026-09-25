
import { Home, Settings, MessageSquare, LayoutDashboard, ChartBar, MapPin, Building2, Building, Megaphone, User, Users, Palette } from "lucide-react";
import { useBrand } from "@/contexts/BrandContext";
import { useQuery } from "@tanstack/react-query";
import { inrange } from "@/integrations/supabase/inrange";
import SidebarNavItem from "./SidebarNavItem";
import { useCurrentTeamAgent } from "@/hooks/useCurrentTeamAgent";

const mainNavItems = [
  {
    id: "dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard"
  }
];

const leadManagementItems = [
  {
    id: "inrange-leads",
    path: "/inrange",
    icon: MapPin,
    label: "InRange Leads",
    matchNested: true
  },
  {
    id: "sales-funnel",
    path: "/sales-funnel",
    icon: ChartBar,
    label: "Sales Funnel"
  }
];

const leasingItems = [
  {
    id: "rental-leads",
    path: "/leasing/renters",
    icon: Home,
    label: "Rental Leads",
    matchNested: true
  },
  {
    id: "landlord-leads",
    path: "/leasing/landlords",
    icon: Building2,
    label: "Landlord Leads",
    matchNested: true
  }
];

const communicationItems = [
  {
    id: "communications",
    path: "/communications",
    icon: MessageSquare,
    label: "Communications"
  },
  {
    id: "marketing",
    path: "/marketing",
    icon: Megaphone,
    label: "Marketing"
  }
];

const accountItems = [
  {
    id: "profile",
    path: "/profile",
    icon: User,
    label: "Profile"
  },
  {
    id: "settings",
    path: "/settings",
    icon: Settings,
    label: "Settings"
  }
];

// Broker/admin-only: invite agents and manage roster. Hidden for agents,
// who have no use for it -- RLS also blocks them from the underlying data.
const teamItems = [
  {
    id: "team",
    path: "/team",
    icon: Users,
    label: "Team"
  },
  {
    id: "brands",
    path: "/brands",
    icon: Palette,
    label: "Brands"
  }
];

type NavItem = { id: string; path: string; icon: typeof Home; label: string; matchNested?: boolean };

const NavSection = ({ title, items }: { title?: string; items: NavItem[] }) => (
  <div className="space-y-1">
    {title && (
      <div className="px-3 py-2">
        <h3 className="text-xs font-semibold text-muted-foreground">{title}</h3>
      </div>
    )}
    {items.map((item) => (
      <SidebarNavItem
        key={item.id}
        path={item.path}
        icon={item.icon}
        label={item.label}
        matchNested={item.matchNested}
      />
    ))}
  </div>
);

const SidebarNav = () => {
  const { isBroker } = useCurrentTeamAgent();
  const { activeBrandId } = useBrand();
  // Exclusive properties: RLS returns only those the user may access
  // (brokers, or agents on the property team), so the section hides itself.
  const { data: exclusives = [] } = useQuery({
    queryKey: ["nav-exclusive-properties", activeBrandId],
    queryFn: async () => {
      let q = inrange
        .from("exclusive_properties" as never)
        .select("slug, name")
        .eq("status", "active");
      if (activeBrandId) q = q.eq("brand_id" as never, activeBrandId as never);
      const { data, error } = await q.order("name");
      if (error) return [];
      return (data ?? []) as unknown as { slug: string; name: string }[];
    },
    staleTime: 5 * 60 * 1000,
  });
  const exclusiveItems: NavItem[] = exclusives.map((p) => ({
    id: `exclusive-${p.slug}`, path: `/exclusives/${p.slug}`, icon: Building, label: p.name, matchNested: true,
  }));

  return (
    <nav className="space-y-6 px-2">
      <NavSection items={mainNavItems} />
      <NavSection title="Lead Management" items={leadManagementItems} />
      <NavSection title="Rental Leasing" items={leasingItems} />
      {exclusiveItems.length > 0 && <NavSection title="Exclusives" items={exclusiveItems} />}
      <NavSection title="Communication" items={communicationItems} />
      {isBroker && <NavSection title="Admin" items={teamItems} />}
      <NavSection title="Account" items={accountItems} />
    </nav>
  );
};

export default SidebarNav;
