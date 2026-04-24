import { cn } from '@/lib/utils';
import type { WireView } from '@/types/wire.types';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  KanbanSquare,
  CalendarDays,
  Zap,
  Megaphone,
  BarChart3,
  Wifi,
} from 'lucide-react';

interface NavItem {
  id: WireView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'inbox', label: 'Inbox', icon: MessageSquare },
  { id: 'contacts', label: 'Contacts', icon: Users },
  { id: 'pipeline', label: 'Pipeline', icon: KanbanSquare },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'automations', label: 'Automations', icon: Zap },
  { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
  { id: 'reporting', label: 'Reporting', icon: BarChart3 },
];

interface WireSidebarProps {
  activeView: WireView;
  onNavigate: (view: WireView) => void;
}

export function WireSidebar({ activeView, onNavigate }: WireSidebarProps) {
  return (
    <aside className="w-56 min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="px-4 py-5 border-b border-gray-700 flex items-center gap-2">
        <div className="bg-yellow-400 rounded-md p-1.5">
          <Wifi className="h-5 w-5 text-gray-900" />
        </div>
        <div>
          <p className="font-bold text-sm leading-none">The Wire</p>
          <p className="text-xs text-gray-400 mt-0.5">Agent Workspace</p>
        </div>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left',
                active
                  ? 'bg-yellow-400 text-gray-900'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="px-4 py-3 border-t border-gray-700">
        <p className="text-xs text-gray-500">Retool-connected</p>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="h-2 w-2 rounded-full bg-green-400" />
          <p className="text-xs text-gray-400">API Active</p>
        </div>
      </div>
    </aside>
  );
}
