import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface LeadListErrorProps {
  error: Error;
}

export const LeadListError = ({ error }: LeadListErrorProps) => {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error loading leads</AlertTitle>
      <AlertDescription>
        {error?.message || 'An unexpected error occurred'}
      </AlertDescription>
    </Alert>
  );
};