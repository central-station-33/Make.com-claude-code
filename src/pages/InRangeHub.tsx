import { useNavigate } from 'react-router-dom';
import { ClipboardList, Plus, Upload, Layers, ChevronRight, ArrowLeft } from 'lucide-react';

const CARDS = [
  {
    icon: ClipboardList,
    title: 'My Leads',
    description: 'Browse and manage all your property leads',
    href: '/inrange/leads',
    iconColor: 'text-blue-500',
    iconBg: 'bg-blue-50 dark:bg-blue-950',
  },
  {
    icon: Plus,
    title: 'Add a Lead',
    description: 'Manually enter a new property lead',
    href: '/inrange/add',
    iconColor: 'text-green-500',
    iconBg: 'bg-green-50 dark:bg-green-950',
  },
  {
    icon: Upload,
    title: 'Import from CSV',
    description: 'Bulk import leads from a spreadsheet',
    href: '/inrange/import',
    iconColor: 'text-purple-500',
    iconBg: 'bg-purple-50 dark:bg-purple-950',
  },
  {
    icon: Layers,
    title: 'Lead Lists',
    description: 'Organize leads into custom lists',
    href: '/inrange/lists',
    iconColor: 'text-orange-500',
    iconBg: 'bg-orange-50 dark:bg-orange-950',
  },
];

export default function InRangeHub() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="text-gray-500 dark:text-gray-400 p-1 -ml-1">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Leads</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Manage your property pipeline</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        <div className="grid grid-cols-2 gap-3">
          {CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.href}
                onClick={() => navigate(card.href)}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 text-left flex flex-col gap-3 shadow-sm active:scale-[0.97] transition-transform"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.iconBg}`}>
                  <Icon className={`h-5 w-5 ${card.iconColor}`} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">{card.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">{card.description}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300 self-end" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
