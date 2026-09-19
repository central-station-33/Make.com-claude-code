
import { LucideIcon } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface SidebarNavItemProps {
  path: string;
  icon: LucideIcon;
  label: string;
  /** Also highlight this item for any nested route under `path` (e.g. /inrange/:id). */
  matchNested?: boolean;
}

const SidebarNavItem = ({ path, icon: Icon, label, matchNested }: SidebarNavItemProps) => {
  const location = useLocation();
  const isActive = matchNested
    ? location.pathname === path || location.pathname.startsWith(`${path}/`)
    : location.pathname === path;

  return (
    <Link
      to={path}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
        "hover:bg-accent hover:text-accent-foreground",
        "dark:text-gray-400 dark:hover:text-gray-50",
        isActive && "bg-accent/50 text-accent-foreground dark:bg-gray-800 dark:text-gray-50"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </Link>
  );
};

export default SidebarNavItem;
