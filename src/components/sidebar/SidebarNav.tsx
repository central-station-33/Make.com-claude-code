
import { Home, Settings, MessageSquare, LayoutDashboard, ChartBar, MapPin, Building2, Megaphone, User } from "lucide-react";
import SidebarNavItem from "./SidebarNavItem";

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
  return (
    <nav className="space-y-6 px-2">
      <NavSection items={mainNavItems} />
      <NavSection title="Lead Management" items={leadManagementItems} />
      <NavSection title="Rental Leasing" items={leasingItems} />
      <NavSection title="Communication" items={communicationItems} />
      <NavSection title="Account" items={accountItems} />
    </nav>
  );
};

export default SidebarNav;
