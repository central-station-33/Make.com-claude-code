import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Layers, Plus } from 'lucide-react';

export default function InRangeLists() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/inrange')} className="text-gray-500 dark:text-gray-400 p-1 -ml-1">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white flex-1">Lead Lists</h1>
        <button className="text-blue-600 dark:text-blue-400 p-1">
          <Plus className="h-5 w-5" />
        </button>
      </div>

      <div className="px-4 py-12 text-center">
        <div className="w-16 h-16 bg-orange-50 dark:bg-orange-950 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Layers className="h-8 w-8 text-orange-500" />
        </div>
        <p className="text-base font-semibold text-gray-900 dark:text-white mb-2">Lead Lists coming soon</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
          Organize your leads into custom lists — by market, strategy, or campaign — to track outreach in groups.
        </p>
        <button
          onClick={() => navigate('/inrange/leads')}
          className="mt-6 px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full text-sm font-semibold"
        >
          View My Leads
        </button>
      </div>
    </div>
  );
}
