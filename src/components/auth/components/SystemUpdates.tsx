import { CardContent } from "@/components/ui/card";

const SystemUpdates = () => {
  return (
    <>
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            System Updates
          </span>
        </div>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        No scheduled maintenance or updates at this time.
      </div>
    </>
  );
};

export default SystemUpdates;