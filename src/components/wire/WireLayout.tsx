import { useState } from 'react';
import { WireSidebar } from './WireSidebar';
import { WireDashboard } from './WireDashboard';
import { WireInbox } from './WireInbox';
import { WireContacts } from './WireContacts';
import { WirePipeline } from './WirePipeline';
import { WireCalendar } from './WireCalendar';
import { WireAutomations } from './WireAutomations';
import { WireCampaigns } from './WireCampaigns';
import { WireReporting } from './WireReporting';
import type { WireView } from '@/types/wire.types';

function ViewContent({ view }: { view: WireView }) {
  switch (view) {
    case 'dashboard':
      return <WireDashboard />;
    case 'inbox':
      return <WireInbox />;
    case 'contacts':
      return <WireContacts />;
    case 'pipeline':
      return <WirePipeline />;
    case 'calendar':
      return <WireCalendar />;
    case 'automations':
      return <WireAutomations />;
    case 'campaigns':
      return <WireCampaigns />;
    case 'reporting':
      return <WireReporting />;
    default:
      return <WireDashboard />;
  }
}

export function WireLayout() {
  const [activeView, setActiveView] = useState<WireView>('dashboard');

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <WireSidebar activeView={activeView} onNavigate={setActiveView} />
      <main className="flex-1 overflow-y-auto">
        <ViewContent view={activeView} />
      </main>
    </div>
  );
}
