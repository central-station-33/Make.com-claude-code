
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface LeadListErrorProps {
  error: Error | null;
  title?: string;
}

const LeadListError = ({ error, title = "Error loading leads" }: LeadListErrorProps) => {
  return (
    <Alert variant="destructive" className="animate-in fade-in duration-300">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        {error?.message || 'An unexpected error occurred'}
      </AlertDescription>
    </Alert>
  );
};

export default LeadListError;
