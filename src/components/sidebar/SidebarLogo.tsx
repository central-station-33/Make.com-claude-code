import { Check, ChevronsUpDown } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useBrand } from '@/contexts/BrandContext';

function BrandMark({ initials, color }: { initials: string; color: string | null }) {
  return (
    <div
      className="h-7 w-7 rounded-md bg-primary flex items-center justify-center shrink-0"
      style={color ? { backgroundColor: color } : undefined}
    >
      <span className="text-white text-[9px] font-black tracking-tighter">{initials}</span>
    </div>
  );
}

export function SidebarLogo() {
  const { brands, activeBrand, setActiveBrandId } = useBrand();
  const queryClient = useQueryClient();

  const header = (
    <div className="flex items-center gap-2 min-w-0">
      <BrandMark initials={activeBrand?.initials ?? 'IR'} color={activeBrand?.primary_color ?? null} />
      <div className="flex flex-col leading-tight min-w-0 text-left">
        <span className="font-bold text-sm tracking-tight truncate">InRange</span>
        <span className="text-[11px] text-muted-foreground truncate">
          {activeBrand?.display_name ?? 'Lead generation'}
        </span>
      </div>
    </div>
  );

  if (brands.length <= 1) return header;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex w-full items-center justify-between gap-2 rounded-md -mx-1 px-1 py-1 hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Switch brand"
      >
        {header}
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Switch brand</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {brands.map((b) => (
          <DropdownMenuItem
            key={b.id}
            onSelect={() => {
              if (b.id === activeBrand?.id) return;
              setActiveBrandId(b.id);
              queryClient.invalidateQueries();
            }}
            className="gap-2"
          >
            <BrandMark initials={b.initials} color={b.primary_color} />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm truncate">{b.display_name}</span>
              <span className="text-[11px] text-muted-foreground truncate">
                {b.license_states.join(' · ') || 'No states set'}
              </span>
            </div>
            {b.id === activeBrand?.id && <Check className="h-4 w-4 shrink-0" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
