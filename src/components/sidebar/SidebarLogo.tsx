
export function SidebarLogo() {
  return (
    <div className="flex items-center gap-2">
      <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center shrink-0">
        <span className="text-primary-foreground text-[10px] font-black tracking-tighter">IR</span>
      </div>
      <div className="flex flex-col leading-tight min-w-0">
        <span className="font-bold text-sm tracking-tight truncate">InRange</span>
        <span className="text-[11px] text-muted-foreground truncate">Jet Realty Advisors</span>
      </div>
    </div>
  );
}
