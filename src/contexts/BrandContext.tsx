import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { inrange } from '@/integrations/supabase/inrange';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Brand profiles: one shared lead engine, one branded front per brokerage.
 * RLS returns only the brands the signed-in user may use (brokers: all;
 * agents: brands they are a member of). The active brand is a UI filter —
 * it scopes lists and dashboards but is not itself an access control.
 */
export interface Brand {
  id: string;
  slug: string;
  name: string;
  team_name: string | null;
  display_name: string;
  sms_signature: string;
  email_signature: string | null;
  ad_disclosure: string | null;
  license_states: string[];
  website_url: string | null;
  sending_email: string | null;
  sms_from_number: string | null;
  logo_url: string | null;
  primary_color: string | null;
  initials: string;
  status: 'active' | 'paused' | 'archived';
  sort_order: number;
}

interface BrandContextValue {
  brands: Brand[];
  activeBrand: Brand | null;
  activeBrandId: string | null;
  setActiveBrandId: (id: string) => void;
  isLoading: boolean;
}

const STORAGE_KEY = 'inrange.activeBrandId';
const BrandContext = createContext<BrandContextValue | undefined>(undefined);

export function BrandProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [storedId, setStoredId] = useState<string | null>(() => {
    try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
  });

  const { data: brands = [], isLoading } = useQuery({
    queryKey: ['brands', user?.id],
    queryFn: async (): Promise<Brand[]> => {
      const { data, error } = await inrange
        .from('brands' as never)
        .select('*')
        .neq('status', 'archived')
        .order('sort_order');
      if (error) return [];
      return (data ?? []) as unknown as Brand[];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const activeBrand = useMemo(
    () => brands.find((b) => b.id === storedId) ?? brands[0] ?? null,
    [brands, storedId],
  );

  useEffect(() => {
    if (activeBrand && activeBrand.id !== storedId) {
      try { localStorage.setItem(STORAGE_KEY, activeBrand.id); } catch { /* ignore */ }
    }
  }, [activeBrand, storedId]);

  const setActiveBrandId = (id: string) => {
    setStoredId(id);
    try { localStorage.setItem(STORAGE_KEY, id); } catch { /* ignore */ }
  };

  return (
    <BrandContext.Provider
      value={{ brands, activeBrand, activeBrandId: activeBrand?.id ?? null, setActiveBrandId, isLoading }}
    >
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  const ctx = useContext(BrandContext);
  if (!ctx) throw new Error('useBrand must be used within BrandProvider');
  return ctx;
}
