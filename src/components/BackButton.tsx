import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * Consistent back link for the desktop/Card-style pages (Settings, Profile,
 * Communications, Marketing, Sales Funnel, legacy Lead Details). The
 * mobile-card pages (InRange*, leasing) have their own established inline
 * ArrowLeft-button convention in their sticky headers -- this isn't meant to
 * replace that, just to give the pages that never had a back affordance a
 * consistent one.
 */
export function BackButton({ to, label = "Back" }: { to: string; label?: string }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors -ml-1 mb-4 px-1 py-1"
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </button>
  );
}
