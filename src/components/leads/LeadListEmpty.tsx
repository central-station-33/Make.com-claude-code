import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const LeadListEmpty = () => {
  return (
    <Alert>
      <AlertTitle>No leads found</AlertTitle>
      <AlertDescription>
        There are currently no leads in the system. Create a new lead to get started.
      </AlertDescription>
    </Alert>
  );
};

export default LeadListEmpty;