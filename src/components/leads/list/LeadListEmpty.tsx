import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export const LeadListEmpty = () => {
  return (
    <Alert>
      <AlertTitle>No leads found</AlertTitle>
      <AlertDescription>
        There are currently no leads in the system. Create a new lead or import leads to get started.
      </AlertDescription>
    </Alert>
  );
};